// Third party library.
import {Component} from '@angular/core';
import {NavController} from 'ionic-angular';

// Utils.
import {Util} from '../../utils/util';

// Config.
import {AppConfig} from '../../app/app.config';

// Services.
import {TranslateService} from 'ng2-translate/ng2-translate';
import {UserService} from '../../providers/user-service';

// Pages.
import {PortalPage} from '../portal/portal';

@Component({
    selector: 'page-login',
    templateUrl: 'login.html',
    providers: [
        UserService
    ]
})
export class LoginPage {
    public user: any = {
        loginID: '',
        password: '',
        autoLogin: false,
        server: this.appConfig.get('BASE_URL')
    };

    servers: any = [
        {
            id: 'iscsys',
            url: this.appConfig.get('BASE_URL_JAPAN'),
            name: ''
        },
        {
            id: 'intalinx_cn',
            url: this.appConfig.get('BASE_URL_CHINA'),
            name: ''
        }
    ];

    isDisabled: boolean = true;

    constructor(public nav: NavController, public appConfig: AppConfig, public userService: UserService, public translate: TranslateService, public util: Util) {
        // set default server.
        this.translate.get(['app.login.iscsys', 'app.login.intalinx_cn']).subscribe(message => {
            this.servers.forEach(element => {
                element.name = message['app.login.' + element.id];
            });
        });

        // show stored loginID, autoLogin, server except password.
        this.util.getLoginID().then((loginID: string) => {
            this.user.loginID = loginID;
        });

        this.util.isAutoLogin().then((isAutoLogin: boolean) => {
            this.user.autoLogin = isAutoLogin;
        });
        this.util.getServer().then((server: string) => {
            if (server != null) {
                this.user.server = server;
            }
        });
    }

    loggedOn() {
        this.userService.loggedOn().then((isLoggedOn: boolean) => {
            if (isLoggedOn) {
                this.redirectToPortal();
            }
        });
    }

    login(loginForm) {
        this.isDisabled = true;
        this.appConfig.set('BASE_URL', this.user.server);
        this.userService.authenticate(this.user.loginID, this.user.password).then(authenticationResult => {
            if (authenticationResult) {
                if (this.user.autoLogin) {
                    this.userService.enableAutoLogin(this.user.loginID, this.user.password, this.user.server);
                } else {
                    this.userService.disableAutoLogin();
                }
                this.redirectToPortal();
            } else if (!authenticationResult) {
                this.isDisabled = null;
                this.translate.get(['app.login.message.error.idOrPasswordNotCorrect']).subscribe(message => {
                    let content = message['app.login.message.error.idOrPasswordNotCorrect'];

                    this.util.presentModal(content, 'error');
                });
            }
        });
    }

    redirectToPortal() {
        this.nav.setRoot(PortalPage);
    }

    ionViewWillEnter() {
        this.isDisabled = true;
    }

    ionViewDidEnter() {
        // If use already logged on, then redirect to portal page.
        this.loggedOn();
    }

    changeUser(event): void {
        if (this.user.loginID && this.user.password && this.user.server) {
            this.isDisabled = null;
        } else {
            this.isDisabled = true;
        }
    }
}