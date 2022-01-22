import { Component, OnInit, Input } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";

@Component({
  selector: "cloutcast-bar-button",
  templateUrl: "./cloutcast-bar-button.component.html",
  styleUrls: ["./cloutcast-bar-button.component.scss"],
})
export class CloutCastBarButtonComponent {
  @Input() link: string;
  @Input() buttonLabel: string;
  @Input() hasNotifications = false;
  @Input() isUnread = false;
  @Input() queryParams = null;
  notificationCount = 1;

  constructor(public globalVars: GlobalVarsService) {}

  _queryParamsForLink(link: string) {
    if (this.queryParams) {
      return this.queryParams;
    }
    if (link.includes(this.globalVars.RouteNames.BROWSE)) {
      return { stepNum: null, adminTab: null };
    }
    return { stepNum: null, adminTab: null, feedTab: null };
  }
}
