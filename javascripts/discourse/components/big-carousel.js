import Component from "@ember/component";
import { computed } from "@ember/object";
import loadScript from "discourse/lib/load-script";
import discourseComputed from "discourse-common/utils/decorators";
import { inject as service } from "@ember/service";
import { ajax } from "discourse/lib/ajax";
import { set } from "@ember/object";

function userSlides(slide, that) {
  // set up user slides
  let bigUserSlides = [];

  if (slide.slide_type === "user") {
    ajax(`/u/${slide.link}.json`).then(function (result) {
      set(slide, "user_info", result);
    });
    ajax(`/u/${slide.link}/summary.json`)
      .then(function (result) {
        set(slide, "user_summary", result);
        bigUserSlides.push(slide);
      })
      .then(function () {
        that.set("bigUserSlides", bigUserSlides);
      });
  }
}

export default Component.extend({
  router: service(),
  bigSlides: computed(function () {
    return JSON.parse(settings.big_carousel_slides);
  }),
  isLoading: true,

  ensureSlider() {
    // set up up manually populated slides
    let bigStaticSlides = [];
    this.set("bigStaticSlides", bigStaticSlides);
    if (this.shouldDisplay && this.bigSlides.length > 1) {
      this.bigSlides.forEach((slide) => {
        if (slide.slide_type === "slide") {
          bigStaticSlides.push(slide);
        }
      });

      Promise.all(this.bigSlides.map((slide) => userSlides(slide, this)))
        .then(() => {
          this.set("isLoading", false);
        })
        .then(() => {
          // slider script
          loadScript(settings.theme_uploads.tiny_slider).then(() => {
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
        });
    }
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
