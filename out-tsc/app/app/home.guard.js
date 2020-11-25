import { __decorate } from "tslib";
import { Injectable } from '@angular/core';
let HomeGuard = class HomeGuard {
    constructor(router) {
        this.router = router;
    }
    canActivate(next, state) {
        if (localStorage.getItem('scuver_driver_user')) {
            return true;
        }
        else {
            this.router.navigateByUrl('/login');
            return false;
        }
    }
};
HomeGuard = __decorate([
    Injectable({
        providedIn: 'root'
    })
], HomeGuard);
export { HomeGuard };
//# sourceMappingURL=home.guard.js.map