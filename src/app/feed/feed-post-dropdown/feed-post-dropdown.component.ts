import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";
import {NFTBidData, NFTEntryResponse, PostEntryResponse} from "../../backend-api.service";
import { ActivatedRoute, Router } from "@angular/router";
import { PlatformLocation } from "@angular/common";
import { BsModalService } from "ngx-bootstrap/modal";

// RPH Modals
import { MintNftModalComponent } from "../../mint-nft-modal/mint-nft-modal.component";
import { CreateNftAuctionModalComponent } from "../../create-nft-auction-modal/create-nft-auction-modal.component";
import { AuctionCreatedModalComponent } from "../../auction-created-modal/auction-created-modal.component";
import { BidPlacedModalComponent } from "../../bid-placed-modal/bid-placed-modal.component";
import { PlaceBidModalComponent } from "../../place-bid-modal/place-bid-modal.component";
import { SelectSerialNumberModalComponent } from "../../select-serial-number-modal/select-serial-number-modal.component";
import { NftSoldModalComponent } from "../../nft-sold-modal/nft-sold-modal.component";
import { CloseNftAuctionModalComponent } from "../../close-nft-auction-modal/close-nft-auction-modal.component";
import { SellNftModalComponent } from "../../sell-nft-modal/sell-nft-modal.component";
import { AddUnlockableModalComponent } from "../../add-unlockable-modal/add-unlockable-modal.component";

@Component({
  selector: "feed-post-dropdown",
  templateUrl: "./feed-post-dropdown.component.html",
  styleUrls: ["./feed-post-dropdown.component.sass"],
})
export class FeedPostDropdownComponent {
  @Input() post: PostEntryResponse;
  @Input() postContent: PostEntryResponse;
  @Input() nftEntryResponses: NFTEntryResponse[];

  @Output() postHidden = new EventEmitter();
  @Output() userBlocked = new EventEmitter();
  @Output() toggleGlobalFeed = new EventEmitter();
  @Output() togglePostPin = new EventEmitter();

  constructor(
    public globalVars: GlobalVarsService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private modalService: BsModalService,
    private platformLocation: PlatformLocation
  ) {}

  reportPost(): void {
    this.globalVars.logEvent("post : report-content");
    window.open(
      `https://report.bitclout.com?ReporterPublicKey=${this.globalVars.loggedInUser?.PublicKeyBase58Check}&PostHash=${this.post.PostHashHex}`
    );
  }

  showBlockUserDropdownItem() {
    if (!this.globalVars.loggedInUser) {
      return false;
    }

    // User shouldn't be able to block themselves
    return (
      this.globalVars.loggedInUser?.PublicKeyBase58Check !== this.post.PosterPublicKeyBase58Check &&
      !this.globalVars.hasUserBlockedCreator(this.post.PosterPublicKeyBase58Check)
    );
  }

  showHidePostDropdownItem() {
    if (!this.globalVars.loggedInUser) {
      return false;
    }

    const loggedInUserPostedThis =
      this.globalVars.loggedInUser.PublicKeyBase58Check === this.post.PosterPublicKeyBase58Check;
    const loggedInUserIsGloboMod =
      this.globalVars.globoMods && this.globalVars.globoMods[this.globalVars.loggedInUser.PublicKeyBase58Check];

    return loggedInUserPostedThis || loggedInUserIsGloboMod;
  }

  globalFeedEligible(): boolean {
    return this.globalVars.showAdminTools();
  }

  showAddToGlobalFeedDropdownItem(): boolean {
    return this.globalFeedEligible() && !this.post.InGlobalFeed;
  }

  showRemoveFromGlobalFeedDropdownItem(): boolean {
    return this.globalFeedEligible() && this.post.InGlobalFeed;
  }

  showPinPostToGlobalFeedDropdownItem(): boolean {
    return this.globalFeedEligible() && !this.post.IsPinned;
  }

  showUnpinPostFromGlobalFeedDropdownItem(): boolean {
    return this.globalFeedEligible() && this.post.IsPinned;
  }

  showCreateNFTAuction(): boolean {
    return (
      this.post.IsNFT &&
      !!this.nftEntryResponses.filter(
        (nftEntryResponse) =>
          !nftEntryResponse.IsForSale &&
          nftEntryResponse.OwnerPublicKeyBase58Check === this.globalVars.loggedInUser?.PublicKeyBase58Check
      )?.length
    );
  }

  hidePost() {
    this.postHidden.emit();
  }

  blockUser() {
    this.userBlocked.emit();
  }

  _addPostToGlobalFeed(event: any) {
    this.toggleGlobalFeed.emit(event);
  }

  _pinPostToGlobalFeed(event: any) {
    this.togglePostPin.emit(event);
  }

  copyPostLinkToClipboard(event) {
    this.globalVars.logEvent("post : share");

    // Prevent the post from navigating.
    event.stopPropagation();

    this.globalVars._copyText(this._getPostUrl());
  }

  _getPostUrl() {
    const pathArray = ["/" + this.globalVars.RouteNames.POSTS, this.postContent.PostHashHex];

    // need to preserve the curent query params for our dev env to work
    const currentQueryParams = this.activatedRoute.snapshot.queryParams;

    const path = this.router.createUrlTree(pathArray, { queryParams: currentQueryParams }).toString();
    const origin = (this.platformLocation as any).location.origin;

    return origin + path;
  }

  openMintNftModal(event, component): void {
    event.stopPropagation();
    this.modalService.show(MintNftModalComponent, {
      class: "modal-dialog-centered modal-lg",
      initialState: { post: this.post },
    });
  }

  openCreateNFTAuctionModal(event): void {
    this.modalService.show(CreateNftAuctionModalComponent, {
      class: "modal-dialog-centered",
      initialState: { post: this.post, nftEntryResponses: this.nftEntryResponses },
    });
  }
}
