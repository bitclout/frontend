import { Component, OnInit } from '@angular/core';

import { Title } from '@angular/platform-browser';
import { NavigationStart, Router } from '@angular/router';
import { BackendApiService, PostEntryResponse } from '../backend-api.service';
import { CloutcastApiService } from '../cloutcast-api.service';
import { GlobalVarsService } from '../global-vars.service';
import { IdentityService } from '../identity.service';

@Component({
  selector: 'app-cloutcast-page',
  templateUrl: './cloutcast-page.component.html',
  styleUrls: ['./cloutcast-page.component.scss']
})
export class CloutCastPageComponent implements OnInit {
  isInitialized: boolean;
  userFollowerCount = {
    username: "",
    count: 0
  };
  userCoinPrice = 0;
  needsApproval: boolean;
  selectedTab: any;
  selectedCast: any;
  selectedCastObject: any;
  selectedPost: PostEntryResponse;
  allCasts: any;
  showCasts: any = [];
  showListLoading: boolean = false;
  showContentLoading: boolean = false;
  constructor(
    public globalVars: GlobalVarsService,
    private cloutcastApi: CloutcastApiService,
    private backendApi: BackendApiService,
    private identityService: IdentityService,
    private router: Router,
    private titleService: Title
  ) {
    this.router.onSameUrlNavigation = 'reload';
  }


  async ngOnInit(): Promise<void> {
    if (!!!this.isInitialized) {
      this.showListLoading = true;
      await this.getActive(true);
      await this.handleEvent(this.router.url);
      if (!!this.globalVars.loggedInUser.ProfileEntryResponse) {
        if (this.globalVars.loggedInUser.ProfileEntryResponse.Username != this.userFollowerCount.username) {
          try {
            const getFollowers = await this.backendApi
                  .GetFollows(
                    this.globalVars.localNode,
                    this.globalVars.loggedInUser.ProfileEntryResponse.Username,
                    "" /* PublicKeyBase58Check */,
                    true /* get followers */,
                    "" /* GetEntriesFollowingUsername */,
                    0 /* NumToFetch */
                  )
                  .toPromise();
                this.userFollowerCount.count = getFollowers.NumFollowers;
            } catch (ex) {
              console.error(ex);
              this.userFollowerCount.count = 0;
            } finally {
              this.userFollowerCount.username = this.globalVars.loggedInUser.ProfileEntryResponse.Username;
            }
        }
      }
      this.isInitialized = true;

    }

    this.router.events.subscribe(async event => {
      if (event instanceof NavigationStart) {
        if (event.restoredState) {
          console.log(event);
        }
        await this.handleEvent(event.url);
      }

   });

  }

  private async handleEvent(url:string) : Promise<any> {
    try {

      this.showListLoading = true;
      // console.log(event);
      if (url.startsWith("/casts/")) {
        // we have a castID!
        if (!!!this.isInitialized) {
          let {selectedTab = "All"} = history.state;
          await this.ccTabClick(selectedTab);
        }

        let castString = url.split("/")[2].split("?")[0];
        let castInt = parseInt(castString);

        if (castInt !== this.selectedCast) {
          this.showContentLoading = true;
          this.selectedCast = castInt;
          this.selectedPost = null;
          await this.getPostByCastId(castInt);
        }
      } else if (url.startsWith("/casts")) {
        if (!this.selectedTab) {
          // console.log(history.state);
          let {selectedTab = "Inbox"} = history.state;
          await this.ccTabClick(selectedTab);
        } else {
          await this.ccTabClick(this.selectedTab);
        }
        this.selectedCast = null;
      }
    } catch (ex) {
      console.error(ex);
    } finally {
      this.showListLoading = false;
      this.showContentLoading = false;
    }
  }

  private async getActive(updateActive: boolean = false): Promise<any> {
    let tError = null;
    try {
      let out = await this.cloutcastApi.getActive();
      if (updateActive == true) {
        this.allCasts = out;
      }

      return out;


    } catch (ex) {
      console.error(ex);
      let {message = "Unspecified error"} = ex;
      if (message == "auth needed") {
        // reroute
        this.router.navigateByUrl("/", {replaceUrl: true});
      }
    } finally {
      if (tError !== null) {
        console.warn("cloutcast error in getAll");
        return [];
      }
    }
  }


  async ccListItemClick(castID) {
    if (this.selectedCast != castID) {
      await this.router.navigateByUrl("/casts/" + castID, {
        state: {
          selectedTab: this.selectedTab,
          selectedCast: this.selectedCast
        },
        skipLocationChange: false
      });
    }
  }

  async ccTabClick(tabName) {
    this.selectedTab = tabName;
    if (Array.isArray(this.allCasts)) {
      if (this.allCasts.length > 0) {
        this.showCasts = [];
        this.showListLoading = true;
        try {
        switch(tabName) {
          case "Inbox":
            for (var cast of this.allCasts) {
              let isFound = false;
              if (Array.isArray(cast.AllowedUsers)) {
                if (cast.AllowedUsers.length) {
                  for (var aU of cast.AllowedUsers) {
                    if (aU == this.globalVars.loggedInUser.PublicKeyBase58Check) {
                      isFound = true;
                    }
                  }
                }
              }
              if (isFound == true) {
                this.showCasts.push(cast);
              }
            }
            break;
          case "For Me":
            let coinPrice = 0;
            let followerCount = 0;

            if (this.globalVars.loggedInUser.ProfileEntryResponse !== null) {
              coinPrice = this.globalVars.loggedInUser.ProfileEntryResponse.CoinPriceBitCloutNanos;
              if (this.globalVars.loggedInUser.ProfileEntryResponse.Username == this.userFollowerCount.username) {
                followerCount = this.userFollowerCount.count;
              } else {
                const getFollowers = await this.backendApi
                  .GetFollows(
                    this.globalVars.localNode,
                    this.globalVars.loggedInUser.ProfileEntryResponse.Username,
                    "" /* PublicKeyBase58Check */,
                    true /* get followers */,
                    "" /* GetEntriesFollowingUsername */,
                    0 /* NumToFetch */
                  )
                  .toPromise();
                followerCount = getFollowers.NumFollowers;
              }
            }
            for (var cast of this.allCasts) {
              let isFound = false;
              if (Array.isArray(cast.AllowedUsers)) {
                if (cast.AllowedUsers.length) {
                  for (var aU of cast.AllowedUsers) {
                    if (aU == this.globalVars.loggedInUser.PublicKeyBase58Check) {
                      isFound = true;
                    }
                  }
                }
              }
              if (isFound == true) {
                this.showCasts.push(cast);
              } else {
                if (cast.MinCoinPriceNanos <= coinPrice && cast.MinFollowerCount <= followerCount) {
                  this.showCasts.push(cast);
                }
              }
            }
            break;
          case "All":
            this.showCasts = this.allCasts;
            break;
        }
        // console.log(tabName);
        } catch (ex) {
          console.error(ex);
        } finally {
          this.showListLoading = false;
        }
      }
    }
  }
  stringifyItem(item:any): string {
    return JSON.stringify(item, null, 4);
  }

  bitcloutToUSD(clout:number): number {
    let t = Math.round(100 * ((this.globalVars.ExchangeUSDCentsPerBitClout / 100) * clout)) / 100;
    // console.log({t, clout, ex: this.globalVars.ExchangeUSDCentsPerBitClout / 100});
    return t;
  }
  nanosToUSD(nanos: number): string {
    return this.globalVars.nanosToUSD(nanos, 2);
  }
  nanosToBitClout(nanos: number): string {
    return this.globalVars.nanosToBitClout(nanos,2);
  }

  rounded(num: number, roundTo: number = 1): number {
    return Math.round(roundTo * num) / roundTo;
  }
  floored(num: number, flooredTo: number = 1): number {
    return Math.floor(flooredTo* num) / flooredTo;
  }

  async getPostByCastId(id: number): Promise<void> {
    try {
      let thePostHex = null;
      for (var item of this.allCasts) {
        let {Id = null} = item;
        if (id == Id) {
          thePostHex = item.gigPostHash;
          this.selectedCastObject = item;
          console.dir(this.selectedCastObject);
        }
      }

      if (thePostHex == null) {
        throw new Error("could not find post");
      }

      await this.getPost(thePostHex);
    } catch (ex) {
      console.error(ex);
      return null;
    }
  }

  async proveWork(): Promise<void> {
    this.showListLoading = true;
    this.showContentLoading = true;

    let theError = null;
    try {
      // console.log(this.selectedCastObject.Id);
      let didWork = await this.cloutcastApi.proveWork(this.selectedCastObject.Id);
      if (didWork == true) {
        this.globalVars._alertSuccess(`${this.nanosToBitClout(this.selectedCastObject.RateNanos)} was added to your CloutCast escrow wallet!`)
      }
    } catch (ex) {
      console.error(ex);
      theError = ex;
      let {message = null} = ex;
      let tMessage = message == null ? JSON.stringify(ex) : message;
      this.globalVars._alertError(tMessage);
    } finally {
      if (theError !== null) {
        console.warn("provework did not complete");
      }
      this.showListLoading = false;
      this.showContentLoading = false;
    }
  }

  async getPost(postHex: string): Promise<void> {
    try {
      let thePost = await this.backendApi.GetSinglePost(
        this.globalVars.localNode,
        postHex,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        false,
        undefined,
        0,
        false
      ).toPromise();
      this.selectedPost = thePost;
      return;
    } catch (ex) {
      console.error(ex);
      return null;
    }
  }

  async mobileBack(): Promise<void> {
    this.selectedCast = undefined;
    this.selectedCastObject = undefined;
    this.selectedPost = undefined;
    this.router.navigate(["/casts"], {
      replaceUrl: true,
      state: {
        selectedTab: this.selectedTab
      }
      // skipLocationChange: true
    });
  }


}

