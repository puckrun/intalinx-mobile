import {Page, IonicApp, NavController, NavParams, ViewController, Platform, Content} from 'ionic-angular';
import {Component, ViewChild} from '@angular/core';

import {TranslatePipe} from 'ng2-translate/ng2-translate';

import {NotificationService} from '../../../providers/notification-service';
import {Util} from '../../../utils/util';

@Page({
    templateUrl: 'build/pages/notification/detail/detail.html',
    providers: [
        NotificationService,
        Util
    ],
    pipes: [TranslatePipe],
    queries: {
        pageContent: new ViewChild(Content)
    }
})

export class DetailPage {

    static get parameters() {
        return [[IonicApp], [NavController], [NavParams], [NotificationService], [ViewController], [Platform]];
    }

    constructor(app, nav, params, notificationService, view, platform) {
        this.app = app;
        this.nav = nav;
        this.params = params;
        this.view = view;
        this.platform = platform;

        this.notification = this.params.get("notification");
        this.id = this.notification.notificationID;
        this.readStatus = this.notification.readStatus;

        this.notificationService = notificationService;

        this.getNotificationDetailByNotificationID();        
    }

    getNotificationDetailByNotificationID() {
        this.notificationService.getNotificationDetailByNotificationID(this.id).then(data => {
            this.title = data.title;
            this.content = data.content;
            this.createUserId = data.createUser;
            this.publishStartDate = data.publishStartDate;
            this.createUserAvatar = data.createUserAvatar;
            this.createUserName = data.createUserName;
            this.status = data.status;
            this.readCount = data.readCount;
            this.isLoadCompleted = true;
            this.isScrollToTopButtonVisible = false;

        });
    }

    onPageLoaded() {
        this.pageLoadTime = new Date().getTime();
    }

    onPageWillUnload() {
        let now = new Date().getTime();
        let pageLoadingTime = now - this.pageLoadTime;
        if (this.status == "PUBLISH" && this.readStatus == "NOT_READ" && pageLoadingTime >= 3000) {
            this.updateReadStatus();
        }
        this.isLoadCompleted = false;
        this.isScrollToTopButtonVisible = false;
    }

    updateReadStatus() {
        let readStatus = "READ";
        this.notificationService.updateReadStatus(this.id, readStatus).then(data => {
            if (data == "true") {
                this.notification.readStatus = readStatus;
                let notificationNewInformationCount = Number(this.app.notificationNewInformationCount);
                this.app.notificationNewInformationCount = notificationNewInformationCount - 1;
            }
        });
    }

    ngAfterViewInit() {
        this.pageContent.addScrollListener(this.onPageScroll(this));
    }

    scrollToDetailPageTop() {
        this.pageContent.scrollToTop();
    }
    
    onPageScroll(that) {
        return function() {
            if (this.scrollTop > 200) {
                that.isScrollToTopButtonVisible = true;
            } else {
                that.isScrollToTopButtonVisible = false;
            }
        }       
    }
}
