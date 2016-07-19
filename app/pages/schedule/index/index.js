import {Page, IonicApp, NavController, ViewController, Platform, Slides, Modal} from 'ionic-angular';
import {ViewChild} from '@angular/core';
import {NgForm, ngClass} from '@angular/common';

import {TranslatePipe} from 'ng2-translate/ng2-translate';

import {ScheduleService} from '../../../providers/schedule-service';
import {UserService} from '../../../providers/user-service';

import {EventDetailPage} from '../event-detail/event-detail';
import {EditEventPage} from '../edit-event/edit-event'

import {SelectUserPage} from '../select-user/select-user'

import {Util} from '../../../utils/util';

@Page({
    templateUrl: 'build/pages/schedule/index/index.html',
    providers: [
        ScheduleService,
        UserService,
        Util
    ],
    pipes: [TranslatePipe],
    queries: {
        slider: new ViewChild('calendarSlides')
    }
})
export class ScheduleIndexPage {

    static get parameters() {
        return [[IonicApp], [NavController], [ViewController], [Platform], [ScheduleService], [UserService]];
    }

    constructor(app, nav, view, platform, scheduleService, userService) {
        this.app = app;
        this.nav = nav;
        this.view = view;
        this.platform = platform;
        
        this.scheduleService = scheduleService;
        this.userService = userService;
        
        this.searchEventsRequires = {
            "categoryID":  "",
            "isRepeat": "",
            "startTime": "",
            "endTime": "",
            "deviceID": "",
            "visibility": "",
            "title": "",
            "summary": "",
            "location": "",
            "timezone": "",
            "selType": "",
            "userId": ""
        }
        this.searchHolidaysRequires = {
            "locale": "",
            "start": "",
            "end": ""
        }
        this.sendDataToShowOrDeleteEvent = {
            "selectedDay": "",
            "eventId": "",
            "daysOfDeletedEvent": "",
            "isRefreshFlag": false
        }

        this.sendDataToAddEvent = {
            "selectedDay": "",
            "daysOfAddedEvent": "",
            "isRefreshFlag": false
        }
        
        this.defaultNumber = 0;
        this.cachedSlidesOnOneSide = 1;
        this.numbers = this.initNumbers(this.defaultNumber, this.cachedSlidesOnOneSide);
        this.calendarSlideOptions = {
            direction: 'vertical',
            initialSlide: this.cachedSlidesOnOneSide
        }
        
        this.weekdays = moment.weekdaysMin(true);
        // In Japan,the first day of the week is Monday. In China and England, the first day of the week is Sunday.
        if (this.app.userLang == "ja" || this.app.userLang == "ja-jp") {
            this.isFirstDayMonday = true;
            let sunday = this.weekdays[0];
            this.weekdays.shift();
            this.weekdays.push(sunday);
        } else {
            this.isFirstDayMonday = false;
        }
        this.today = moment().format('YYYY/MM/D');
        this.yearMonth = moment().format('YYYY-MM');
        this.minDisplayDate = Number(moment().format('YYYY')) - 5 + "-01";
        this.maxDisplayDate = Number(moment().format('YYYY')) + 5 + "-12";
        //this month
        let firstDateWeek = moment(this.yearMonth);
        this.selectedDay = this.today;
        
        // let userId =this.app.user.userId;
        this.userService.getUserDetails().then(user => {
            this.myUserId = user.userId;
            this.myUserName = user.userName;
            this.searchEventsRequires.userId = user.userId;
            this.selectedUserName = user.userName;
            this.getLocalsFromSetting().then(local => {
                this.showCalendar(firstDateWeek);
            });
        });
    }
    
    changeCalendar(event) {
        let yearMonth = moment({
            y: event.year.value,
            M: event.month.value - 1});
        //selected month
        let firstDateWeek = moment(yearMonth);
        this.selectedDay = firstDateWeek.format('YYYY/MM/D');
        this.showCalendar(firstDateWeek);
    }
    
    lastMonth() {
        this.yearMonth = moment(this.yearMonth).subtract(1, 'months').format('YYYY-MM');
        //last month
        let firstDateWeek = moment(this.yearMonth);
        this.selectedDay = firstDateWeek.format('YYYY/MM/D');
        this.showCalendar(firstDateWeek);
    }
    
    nextMonth() {
        this.yearMonth = moment(this.yearMonth).add(1, 'months').format('YYYY-MM');
        //next month
        let firstDateWeek = moment(this.yearMonth);
        this.selectedDay = firstDateWeek.format('YYYY/MM/D');
        this.showCalendar(firstDateWeek);
    }
    
    showCalendar(firstDateWeek) {
        this.daysOfEvents = new Array();
        //the quantity of days in selected month
        let daysInMonth = firstDateWeek.daysInMonth();
        //the weekday of the first day on this month
        let firstDayWeek = firstDateWeek.format('d');
        //weekdays
        let timeline = [];
        //calendar
        let calendar = [];

        // In Japan,the first day of the week is Monday. In China and England, the first day of the week is Sunday.\
        let indexOfFirstDayInWeek = 0;
        let indexOfLastDayInWeek = 6;
        if (this.isFirstDayMonday && this.isFirstDayMonday == true) {
            indexOfFirstDayInWeek = 1;
            indexOfLastDayInWeek = 0;
        }
        
        //day and weekday
        if (indexOfFirstDayInWeek == 1 && firstDayWeek == 0){
            for (let i=indexOfFirstDayInWeek; i<7; i++) {
                timeline.push(moment(firstDateWeek).subtract(7-i, 'days'));
            }
        } else {
            for (let i=indexOfFirstDayInWeek; i<firstDayWeek; i++) {
                timeline.push(moment(firstDateWeek).subtract(firstDayWeek-i, 'days'));
            }
        }
        for (let i=0; i<daysInMonth; i++) {
            timeline.push(moment(firstDateWeek).add(i, 'days'));
        }
        let lastDayWeek = moment(firstDateWeek).endOf('month').format('d');
        let lastDateInMonth = moment(firstDateWeek).endOf('month');
        if (lastDayWeek!=indexOfLastDayInWeek) {
            for (let i=0; i<6-lastDayWeek+indexOfFirstDayInWeek; i++) {
                timeline.push(moment(lastDateInMonth).add(i+1, 'days'));
            }
        }
        //calendar
        for (let i=0; i<Math.ceil(timeline.length/7); i++) {
            calendar[i] = timeline.slice(i*7, (i+1)*7);
        }
        this.calendar = calendar;
        
        this.moment = moment().format("HH:mm");
        
        this.isHtmlLoadCompleted = true;
        
        this.searchEventsAndSpecialDaysBySelectedDay(this.selectedDay).then(data =>{
            if (data=="true") {
                this.searchEventsByDisplayedMonth();
            }
        });
    }
    
    searchEventsAndSpecialDaysBySelectedDay(selectedDay) {
        this.specialDays = [];
        this.events == [];
        this.isEventLoadCompleted = false;
         return new Promise(resolve => {
            this.selectedDay = selectedDay;
            let startTime = moment(selectedDay).unix();
            let endTime = moment(selectedDay).add(1, 'd').subtract('seconds', 1).unix();
            
            this.searchEventsRequires.startTime = startTime;
            this.searchEventsRequires.endTime = endTime;
            
            this.getSpecialDays(this.selectedDay);

            this.scheduleService.searchEventsBySelectedDay(this.searchEventsRequires).then(data => {
                this.events = data;
                this.isEventLoadCompleted = true;
                resolve("true");
            });
        });
    }
    
    searchEventsByDisplayedMonth() {
        let startTimeOfMonth = moment(this.yearMonth).unix() + moment().zone() * 60;
        let endTimeOfMonth = moment(this.yearMonth).add('months', 1).subtract('seconds', 1).unix() + moment().zone() * 60;
        this.searchEventsRequires.startTime = startTimeOfMonth;
        this.searchEventsRequires.endTime = endTimeOfMonth;
        this.searchHolidaysRequires.start = startTimeOfMonth;
        this.searchHolidaysRequires.end = endTimeOfMonth;
        this.scheduleService.searchEventsByDisplayedMonth(this.searchEventsRequires).then(eventsDays => {
 
            this.scheduleService.searchSpecialDaysByDisplayedMonth(this.searchHolidaysRequires).then(specialDays => {
                eventsDays = eventsDays.concat(specialDays);
                this.daysOfEvents = Array.from(new Set(eventsDays));
                this.daysOfEvents = eventsDays;
            });
        });
    }
    
    getLocalsFromSetting() {
        return new Promise(resolve => {
            this.scheduleService.getUserLocaleSettings(this.searchEventsRequires.userId).then(locale => {
                this.searchHolidaysRequires.locale = locale;
                resolve(locale);
            });
        });
    }
    
    getSpecialDays(selectedDay) {
         return new Promise(resolve => {
            this.selectedDay = selectedDay;
            let startTime = moment(selectedDay).unix();
            let endTime = moment(selectedDay).add(1, 'd').subtract('seconds', 1).unix();
            
            this.searchHolidaysRequires.start = startTime;
            this.searchHolidaysRequires.end = endTime;

            this.scheduleService.getSpecialDaysInSelectedDay(this.searchHolidaysRequires, this.selectedDay).then(data => {
                this.specialDays = data;
                resolve("true");
            });
        });
    }
    
    changeMonth(swiper) {
        let backward = swiper.swipeDirection === 'prev';
		let newIndex = this.slider.getActiveIndex();
        if (backward) {
            while (newIndex < this.cachedSlidesOnOneSide) {
                newIndex++;
                this.numbers.unshift(this.numbers[0] - 1);
				this.numbers.pop();
                this.lastMonth();
            }
        } else {
            while (newIndex > this.cachedSlidesOnOneSide) {
                newIndex--;
                this.numbers.push(this.numbers[this.numbers.length - 1] + 1);
				this.numbers.shift();
                this.nextMonth();
            }
        }
        // Workaround to make it work: breaks the animation
        this.slider.slideTo(newIndex, 0, false);
    }
    
   /**
   * Makes an initial array of numbers to slide, based on the cache size specified
   */
	initNumbers(defaultNumber, cachedSlidesOnOneSide) {
		let length = 2 * cachedSlidesOnOneSide + 1;
		let numbers = new Array(length);
		numbers[cachedSlidesOnOneSide] = defaultNumber;
		let pushedNumber = defaultNumber;
		for (let i = cachedSlidesOnOneSide - 1; i >= 0; i--) {
			pushedNumber--;
			numbers[i] = pushedNumber;
		}
		pushedNumber = defaultNumber;
		for (let i = cachedSlidesOnOneSide + 1; i < length; i++) {
			pushedNumber++;
			numbers[i] = pushedNumber;
		}
		return numbers;
	}
    
    openEventDetail(event) {
        this.sendDataToShowOrDeleteEvent.selectedDay = this.selectedDay;
        this.sendDataToShowOrDeleteEvent.eventId = event.eventID;
        this.nav.push(EventDetailPage, {
            "sendDataToShowOrDeleteEvent": this.sendDataToShowOrDeleteEvent
        });
    }
    
    addEvent() {
        this.sendDataToAddEvent.selectedDay = this.selectedDay;
        this.nav.push(EditEventPage, {
            "sendDataToAddEvent": this.sendDataToAddEvent
        });
    }
    
    selectUser() {
        let selectUserModal = Modal.create(SelectUserPage);
        selectUserModal.onDismiss(data => {
            if (data) {
                this.searchEventsRequires.userId = data.userId;
                this.selectedUserName = data.userName;
                this.showCalendar(moment(this.yearMonth));
            }
        });
        this.nav.present(selectUserModal);
    }
    
    showToday() {
        this.selectedDay = this.today;
        this.yearMonth = moment().format('YYYY-MM');
        //this month
        let firstDateWeek = moment(this.yearMonth);
        this.showCalendar(moment(this.yearMonth));
    }
    
    showMySchedule() {
        this.searchEventsRequires.userId = this.myUserId;
        this.selectedUserName = this.myUserName;
        this.showCalendar(moment(this.yearMonth));
    }
    
    onPageWillEnter() {
        // enter page after deleting event
        let isRefreshFlag = this.sendDataToShowOrDeleteEvent.isRefreshFlag;
        if (isRefreshFlag == true) {
            this.searchEventsAndSpecialDaysBySelectedDay(this.sendDataToShowOrDeleteEvent.selectedDay);
            for (let i = 0; i < this.sendDataToShowOrDeleteEvent.daysOfDeletedEvent.length; i++) {
                let index = this.daysOfEvents.indexOf(this.sendDataToShowOrDeleteEvent.daysOfDeletedEvent[i]);
                if(index != -1) {
                    this.daysOfEvents.splice(index, 1);
                }
            }
            this.sendData.isRefreshFlag = false;
        }
        // enter page after adding event
        let isRefreshFlagFromAddEvent = this.sendDataToAddEvent.isRefreshFlag;
        if (isRefreshFlagFromAddEvent == true) {
            this.searchEventsAndSpecialDaysBySelectedDay(this.sendDataToAddEvent.selectedDay);
            this.daysOfEvents = this.daysOfEvents.concat(this.sendDataToAddEvent.daysOfAddedEvent);
            this.sendDataToAddEvent.isRefreshFlag = false;
        }
    }
}
