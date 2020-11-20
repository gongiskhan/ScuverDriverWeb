import { Component, OnInit } from '@angular/core';
import firebase from 'firebase';
import {Router} from "@angular/router";
import {environment} from "../../environments/environment";

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {

  // email = 'goncalo.p.gomes@hotmail.com';
  // password = 'tmp12345';
  email = '';
  password = '';

  constructor(private router: Router) { }

  ngOnInit() {
    if (firebase.apps.length === 0) {
      firebase.initializeApp(environment.firebase);
    }
  }

  signIn = () => {
    console.log('email', this.email);
    console.log('password', this.password);
    firebase
      .auth()
      .setPersistence(firebase.auth.Auth.Persistence.LOCAL)
      .then(() => {
        firebase
          .auth()
          .signInWithEmailAndPassword((this.email && this.email.toLowerCase().trim()) || ' ', this.password || ' ')
          .then((authUser) => {
            console.log('authUser', authUser);
            localStorage.setItem('scuver_driver_user', JSON.stringify(authUser));
            this.router.navigateByUrl('/home');
          })
          .catch((err: any) => {
            console.log('err.message', err.message);
            alert(err.message);
          });
      });
  };
}
