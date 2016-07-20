// Third party library.
import {Injectable} from '@angular/core';
import {TranslateService} from 'ng2-translate/ng2-translate';
import {NavController, Alert} from 'ionic-angular';

// Config.
import {AppConfig} from '../appconfig';

// Utils.
import {Util} from '../utils/util';
import {SSO} from '../utils/sso';

@Injectable()
export class UserService {

    constructor(private translate: TranslateService, private nav: NavController, private appConfig: AppConfig, private util: Util, private sso: SSO) {
    }

    loggedOn(): Promise<any> {
        return this.sso.loggedOn();
    }

    authenticate(loginID, password): Promise<any> {
        return new Promise(resolve => {
            this.sso.authenticate(loginID, password).then(authenticationResult => {
                if (authenticationResult || !authenticationResult) {
                    resolve(authenticationResult);
                } else {
                    this.translate.get(['app.blog.message.error.title', 'app.message.error.systemError', 'app.action.ok']).subscribe(message => {
                        let title = message['app.blog.message.error.title'];
                        let ok = message['app.action.ok'];
                        let content = message['app.message.error.systemError'];

                        let alert = Alert.create({
                            title: title,
                            subTitle: content,
                            buttons: [ok]
                        });
                        this.nav.present(alert);
                    });
                }
            });
        });
    }

    updateProfile(user): Promise<any> {
        return new Promise(resolve => {
            if (this.validateUserPassword(user.newPassword, user.confirmPassword)) {

                this.util.getRequestXml('./assets/requests/set_password.xml').then((req: string) => {
                    let objRequest = this.util.parseXml(req);
                    this.util.setNodeText(objRequest, './/*[local-name()=\'OldPassword\']', user.oldPassword);
                    this.util.setNodeText(objRequest, './/*[local-name()=\'NewPassword\']', user.newPassword);
                    req = this.util.xml2string(objRequest);

                    this.util.callCordysWebservice(req).then(data => {
                        resolve(true);
                    });
                });
            }
        });
    }

    validateUserPassword(newPassword, confirmPassword): boolean {
        let passwordEmptyFault = newPassword === '' && confirmPassword === '';
        let arePasswordsSame = newPassword === confirmPassword;
        if (passwordEmptyFault) {
            this.translate.get(['app.profile.message.error.title', 'app.profile.message.error.emptyPassword', 'app.action.ok']).subscribe(message => {
                let title = message['app.profile.message.error.title'];
                let ok = message['app.action.ok'];
                let content = message['app.profile.message.error.emptyPassword'];

                let alert = Alert.create({
                    title: title,
                    subTitle: content,
                    buttons: [ok]
                });
                this.nav.present(alert);
            });
        } else if (!arePasswordsSame) {
            this.translate.get(['app.profile.message.error.title', 'app.profile.message.error.mismatchPassword', 'app.action.ok']).subscribe(message => {
                let title = message['app.profile.message.error.title'];
                let ok = message['app.action.ok'];
                let content = message['app.profile.message.error.mismatchPassword'];

                let alert = Alert.create({
                    title: title,
                    subTitle: content,
                    buttons: [ok]
                });
                this.nav.present(alert);
            });
        }
        return !passwordEmptyFault && arePasswordsSame;
    }

    getUserDetails(): Promise<any> {
        return new Promise(resolve => {
            this.util.getRequestXml('./assets/requests/get_user_details.xml').then((req: string) => {
                let objRequest = this.util.parseXml(req);
                req = this.util.xml2string(objRequest);
                this.util.callCordysWebservice(req).then((data: string) => {
                    let objResponse = this.util.parseXml(data);
                    let userOutput = this.util.selectXMLNode(objResponse, './/*[local-name()=\'User\']');
                    let originalUser = this.util.xml2json(userOutput).User;
                    let userAvatar = originalUser.ContactInformation.address;
                    if (!userAvatar) {
                        userAvatar = this.appConfig.get('USER_DEFAULT_AVATAR_IMAGE_URL');
                    }
                    let user = {
                        'userID': originalUser.UserName,
                        'userName': originalUser.Description,
                        'email': originalUser.ContactInformation.email,
                        'phone': originalUser.ContactInformation.phone,
                        'fax': originalUser.ContactInformation.fax,
                        'userAvatar': userAvatar,
                        'company': originalUser.ContactInformation.company
                    };
                    resolve(user);
                });
            });
        });
    }

    setUserDetails(user): Promise<any> {
        return new Promise(resolve => {
            this.util.getRequestXml('./assets/requests/set_user_details.xml').then((req: string) => {
                let objRequest = this.util.parseXml(req);
                this.util.setNodeText(objRequest, './/*[local-name()=\'Description\']', user.userName);
                this.util.setNodeText(objRequest, './/*[local-name()=\'email\']', user.email);
                this.util.setNodeText(objRequest, './/*[local-name()=\'phone\']', user.phone);
                this.util.setNodeText(objRequest, './/*[local-name()=\'fax\']', user.fax);
                this.util.setNodeText(objRequest, './/*[local-name()=\'address\']', user.userAvatar);
                this.util.setNodeText(objRequest, './/*[local-name()=\'company\']', user.company);
                req = this.util.xml2string(objRequest);

                this.util.callCordysWebservice(req).then(data => {
                    resolve(user);
                });
            });
        });
    }

    changeUserAvatar(userAvatar): Promise<any> {
        return new Promise(resolve => {
            this.getUserDetails().then((user: any) => {
                user.userAvatar = userAvatar;
                this.setUserDetails(user).then(user => {
                    resolve(user);
                });
            });
        });
    }
    
    getUserID(): Promise<any> {
        return new Promise(resolve => {
            this.getUserDetails().then((user: any) => {
                resolve(user.userID);
            });
        });
    }
}