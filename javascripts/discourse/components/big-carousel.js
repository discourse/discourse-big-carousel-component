import Component from "@ember/component";
import { computed } from "@ember/object";
import loadScript from "discourse/lib/load-script";
import discourseComputed from "discourse-common/utils/decorators";
import { inject as service } from "@ember/service";
import { iconNode } from "discourse-common/lib/icon-library";

export default Component.extend({
  router: service(),
  bigSlides: computed(function () {
    return JSON.parse(settings.big_carousel_slides);
  }),

  @discourseComputed()
  bigStaticSlides() {
    let bigStaticSlides = [];
    this.bigSlides.forEach((slide) => {
      if (slide.slide_type === "slide") {
        bigStaticSlides.push(slide);
      }
    });
    return bigStaticSlides;
  },

  @discourseComputed()
  bigUserSlides() {
    let bigUserSlides = [];
    this.bigSlides.forEach((slide) => {
      if (slide.slide_type === "user") {
        bigUserSlides.push(slide);
      }
    });
    return bigUserSlides;
  },

  ensureSlider() {
    if (this.shouldDisplay && this.bigSlides.length > 1) {
      return loadScript(settings.theme_uploads.tiny_slider).then(() => {
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

        console.log(slider.getInfo()); // temp
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
