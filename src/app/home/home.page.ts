import { Component } from '@angular/core';
import {DataSnapshot} from "@angular/fire/database/interfaces";
import {Order} from "../../model/order";
import firebase from 'firebase';
import * as moment from 'moment';
import {environment} from "../../environments/environment";

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  orders = [];
  deliveries = [];
  user= null;
  pendingOrders = 0;
  preparedOrders = 0;
  deliveringOrder: Order;
  states = {
    completed: 'Entregue',
    pending: 'Em Preparação',
    viewed: 'Em Preparação',
    sent: 'Pronta para Entrega',
    ready: 'Pronta para Entrega',
    assigned: 'A Recolher',
    bringing: 'A Entregar',
    delivered: 'Entregue',
  };
  latitude;
  longitude;

  constructor() {}

  ngOnInit() {
    if (firebase.apps.length === 0) {
      firebase.initializeApp(environment.firebase);
    }
    this.setUser().then(() => {
      setInterval(() => {
        this.getPosition();
      }, 5000);
      this.subscribeOrders();
    });
  }

  setUser() {
    return new Promise(resolve => {
      let authUser: any = localStorage.getItem('scuver_driver_user');
      if (authUser) {
        authUser = JSON.parse(authUser);
        firebase.firestore().collection('user').where('email','==',  authUser.user.email.toLowerCase().trim()).onSnapshot(u => {
          const fU = u.docs[0] && u.docs[0].data();
          console.log('fU', fU);
          if (fU) {
            this.user = fU;
            if(!this.latitude) {
              this.latitude = this.user.address.coordinates.O;
              this.longitude = this.user.address.coordinates.F;
            }
            resolve();
          } else {
            alert('Não está registado como estafeta ou ocorreu um problema a obter os dados.');
          }
        });
      } else {
        alert('Não tem o login feito.');
      }
    });
  }

  getPosition() {
    navigator.geolocation.getCurrentPosition(resp => {
        this.latitude = resp.coords.latitude;
        this.longitude = resp.coords.longitude;
        // console.log('About to update coordinates', this.latitude, this.longitude);
        firebase.firestore().collection('user').doc(this.user.key).update({
          coordinates: [this.latitude, this.longitude]
        });
      },
      err => {
        console.error(err);
      });
  }

  subscribeOrders() {
    firebase
      .database()
      .ref('/order')
      .orderByChild('deliveryDate')
      // .equalTo('completed')
      .on('value', (results) => {
        console.log('Order data: ', results.val());
        const orders = [];
        let pendingOrders = 0;
        let preparedOrders = 0;
        let deliveringOrder = null;
        results.forEach((doc: DataSnapshot) => {
          const order: Order = doc.val();
          // console.log('order', order);
          if (
            order.orderType === 'delivery' &&
            (order.status === 'viewed' ||
              order.status === 'sent' ||
              order.status === 'ready')
          ) {
            order.status === 'sent' || order.status === 'ready' ? preparedOrders++ : pendingOrders++;
            orders.push(order);
          } else if (order.status === 'bringing' && order.driver == this.user.email) {
            deliveringOrder = order;
          }
        });
        this.deliveringOrder = deliveringOrder;
        if (this.deliveringOrder) {
          this.orders = [deliveringOrder];
        } else {
          this.orders = orders;
        }
        this.pendingOrders = pendingOrders;
        this.preparedOrders = preparedOrders;
      });
  }

  bringing(order: Order) {
    if(this.orderWithinDistance(order)) {
      // if(order.sentToDelivery) {
        if(confirm('Aceitar encomenda?')) {
          firebase
            .database()
            .ref('/order/' + order.key)
            .update({status: 'bringing', driver: this.user.email, acceptedAt: new Date()});
          this.deliveringOrder = {...order, status: 'bringing'} as Order;
        }
      // } else {
      //   alert('Ocorreu um erro ao tentar aceitar a encomenda. Por favor tente outra vez.');
      // }
    } else {
      alert(`Não está dentro do raio de entrega. Por favor verifique se a distância do restaurante é inferior a ${this.user.realDeliveryRadius || 3}km e nesse caso informe-nos por favor.`);
    }
  }

  complete(order: Order) {
    let message = 'Confirma que entregou a encomenda?';
    if(order.paymentMethod === 'atm' || order.paymentMethod === 'tpa') {
      message += '\n\nEsta encomenda deve ser cobrada por cartão multibanco ou no caso de não ter TPA deve informar o cliente que entraremos em contacto mais tarde.';
    }
    if(confirm(message)) {
      firebase
        .database()
        .ref('/order/' + order.key)
        .update({status: 'delivered', deliveredAt: new Date()});
      this.deliveringOrder = null;
    }
  }

  formatHours(date) {
    return moment(date).format('HH:mm');
  }

  openMap(coordinates) {
    window.open(`http://www.google.com/maps/place/${coordinates.latitude},${coordinates.longitude}`);
  }

  orderWithinDistance(order: Order) {
    if(order.restaurantAddress && order.restaurantAddress.coordinates && order.restaurantAddress.coordinates.latitude) {
      const driverRadius = (this.user && this.user.realDeliveryRadius) || 3;
      console.log('driverRadius', driverRadius);
      const distance = this.haversineDistance(order.restaurantAddress.coordinates.latitude, order.restaurantAddress.coordinates.longitude);
      console.log('distance', distance);
      const isWhithinRadius = distance < driverRadius;
      console.log('isWhithinRadius', isWhithinRadius);
      return isWhithinRadius;
    }
  }

  calculateCost(order) {
    let cost = order.total || (order.subTotal + (order.deliveryFee === 0 ? 0 : (!!order.deliveryFee ? order.deliveryFee: 1.75)) );
    if (order.promotion && !order.promotion.used) {
      cost -= order.promotion.amount;
    }
    return cost;
  }

  private haversineDistance(destLat, destLng) {
    const toRadian = angle => (Math.PI / 180) * angle;
    const distance = (a, b) => (Math.PI / 180) * (a - b);
    const RADIUS_OF_EARTH_IN_KM = 6371;

    const dLat = distance(this.latitude, destLat);
    const dLon = distance(this.longitude, destLng);

    const lat1 = toRadian(this.latitude);
    const lat2 = toRadian(destLat);

    // Haversine Formula
    const a =
      Math.pow(Math.sin(dLat / 2), 2) +
      Math.pow(Math.sin(dLon / 2), 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.asin(Math.sqrt(a));

    return RADIUS_OF_EARTH_IN_KM * c;
  };
}
