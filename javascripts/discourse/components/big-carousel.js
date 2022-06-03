import Component from "@ember/component";
import { computed } from "@ember/object";
import loadScript from "discourse/lib/load-script";
import discourseComputed from "discourse-common/utils/decorators";
import { inject as service } from "@ember/service";
import { ajax } from "discourse/lib/ajax";
import { set } from "@ember/object";
import { Promise } from "rsvp";

export default Component.extend({
  router: service(),
  bigSlides: computed(function () {
    return JSON.parse(settings.big_carousel_slides);
  }),
  isLoading: true,

  ensureSlider() {
    let bigStaticSlides = [];

    if (this.shouldDisplay && this.bigSlides.length > 1) {
      // set up static populated slides
      this.bigSlides.forEach((slide) => {
        if (slide.slide_type === "slide") {
          bigStaticSlides.push(slide);
        }
      });

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

      Promise.all([userSetup, userActivity])
        .then(() => {
          this.set("bigUserSlides", bigUserSlides);
          loadScript(settings.theme_uploads.tiny_slider).then(() => {
            // slider script
            var slider = tns({
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

    this.set("bigStaticSlides", bigStaticSlides);
  },

  @discourseComputed("router.currentRouteName")
  shouldDisplay(currentRouteName) {
    return currentRouteName == "discovery.categories";
  },

  init() {
    this._super(...arguments);
    this.appEvents.on("page:changed", this, "ensureSlider");
  },
});
