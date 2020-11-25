import { __decorate } from "tslib";
import { Component } from '@angular/core';
import firebase from 'firebase';
import { environment } from "../../environments/environment";
let LoginPage = class LoginPage {
    constructor(router) {
        this.router = router;
        // email = 'goncalo.p.gomes@hotmail.com';
        // password = 'tmp12345';
        this.email = '';
        this.password = '';
        this.signIn = () => {
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
                    .catch((err) => {
                    console.log('err.message', err.message);
                    alert(err.message);
                });
            });
        };
    }
    ngOnInit() {
        if (firebase.apps.length === 0) {
            firebase.initializeApp(environment.firebase);
        }
    }
};
LoginPage = __decorate([
    Component({
        selector: 'app-login',
        templateUrl: './login.page.html',
        styleUrls: ['./login.page.scss'],
    })
], LoginPage);
export { LoginPage };
//# sourceMappingURL=login.page.js.map