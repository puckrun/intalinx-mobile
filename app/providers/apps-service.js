import {Http} from '@angular/http';
import {IonicApp} from 'ionic-angular';
import {BlogService} from './blog-service';
import {NotificationService} from './notification-service';

export class AppsService {

    static get parameters() {
        return [[Http], [IonicApp], [BlogService],[NotificationService]];
    }

    constructor(http, app, blogService, notificationService) {
        this.http = http;
        this.app = app;
        this.data = null;
        this.blogService = blogService;
        this.notificationService = notificationService;
    }

    load() {
        if (this.data) {
            // already loaded data
            return Promise.resolve(this.data);
        }

        // don't have the data yet
        return new Promise(resolve => {
            // We're using Angular Http provider to request the data,
            // then on the response it'll map the JSON data to a parsed JS object.
            // Next we process the data and resolve the promise with the new data.
            this.http.get('./mocks/appsservice/load.json')
                .map(res => res.json())
                .subscribe(data => {
                    // we've got back the raw data, now generate the core schedule data
                    // and save the data for later reference
                    let items = Array.from(data);
                    items.forEach(function(element) {
                       this.getNewInformationCount(element);
                    }, this);
                    
                    this.data = items;
                    resolve(this.data);
                });
        });
    }

    getNewInformationCount(item) {
        if (item.componentsId == "blog") {
            this.blogService.getNotReadCommunityCountBySelf().then(data => {
                if (data) {
                    this.app.blogNewInformationCount = data;
                }
            });
        }
        if (item.componentsId == "notification") {
            this.notificationService.getNotReadNotificationCountBySelf().then(data => {
                if (data) {
                    this.app.notificationNewInformationCount = data;
                }
            });
        }
    }
}

