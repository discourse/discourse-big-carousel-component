/* global tns */
import Component from "@ember/component";
import { computed, set } from "@ember/object";
import { service } from "@ember/service";
import { Promise } from "rsvp";
import { ajax } from "discourse/lib/ajax";
import loadScript from "discourse/lib/load-script";
import discourseComputed from "discourse-common/utils/decorators";

export default class BigCarousel extends Component {
  @service router;

  isLoading = true;

  @computed
  get bigSlides() {
    return JSON.parse(settings.big_carousel_slides);
  }

  ensureSlider() {
    if (this.shouldDisplay && this.bigSlides.length > 1) {
      // set up static populated slides

      const bigStaticSlides = this.bigSlides.filterBy("slide_type", "slide");
      const staticSlides = Promise.all(
        this.bigSlides.filterBy("slide_type", "slide")
      );

      let bigUserSlides = [];

      // get user info
      const userSlides = this.bigSlides.filterBy("slide_type", "user");
      let userSetup = Promise.all(
        userSlides.map((slide) => {
          return ajax(`/u/${slide.link}.json`).then((result) => {
            set(slide, "user_info", result);
          });
        })
      );

      // get user activity
      let userActivity = Promise.all(
        userSlides.map((slide) => {
          return ajax(
            `user_actions.json?offset=0&username=${slide.link}&filter=5`
          ).then((result) => {
            set(slide, "user_activity", result.user_actions.slice(0, 3));
            bigUserSlides.push(slide);
          });
        })
      );

      Promise.all([staticSlides, userSetup, userActivity])
        .then(() => {
          this.set("bigUserSlides", bigUserSlides);
          this.set("bigStaticSlides", bigStaticSlides);
          loadScript(settings.theme_uploads.tiny_slider).then(() => {
            // slider script
            tns({
              container: ".custom-big-carousel-slides",
              items: 1,
              controls: true,
              autoplay: settings.big_carousel_autoplay,
              speed: settings.big_carousel_speed,
              prevButton: ".custom-big-carousel-prev",
              nextButton: ".custom-big-carousel-next",
              navContainer: ".custom-big-carousel-nav",
            });
          });
        })
        .finally(() => {
          this.set("isLoading", false);
        });
    }
  }

  @discourseComputed("router.currentRouteName")
  shouldDisplay(currentRouteName) {
    return currentRouteName === "discovery.categories";
  }

  didInsertElement() {
    super.didInsertElement(...arguments);
    this.appEvents.on("page:changed", this, "ensureSlider");
  }

  willDestroyElement() {
    super.willDestroyElement(...arguments);
    this.appEvents.off("page:changed", this, "ensureSlider");
  }
}
