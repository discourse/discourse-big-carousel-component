/* global tns */
import Component from "@ember/component";
import { concat } from "@ember/helper";
import { computed, set } from "@ember/object";
import { service } from "@ember/service";
import { Promise } from "rsvp";
import { and } from "truth-helpers";
import ConditionalLoadingSpinner from "discourse/components/conditional-loading-spinner";
import avatar from "discourse/helpers/avatar";
import icon from "discourse/helpers/d-icon";
import htmlSafe from "discourse/helpers/html-safe";
import { ajax } from "discourse/lib/ajax";
import discourseComputed from "discourse/lib/decorators";
import loadScript from "discourse/lib/load-script";

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

  <template>
    {{#if this.shouldDisplay}}
      <div class="custom-big-carousel">
        <div class="custom-big-carousel-prev">
          {{icon "chevron-left"}}
        </div>

        <div class="custom-big-carousel-next">
          {{icon "chevron-right"}}
        </div>

        <div class="custom-big-carousel-slides">
          {{#each this.bigStaticSlides as |bs|}}
            <div
              class="custom-big-carousel-slide"
              style={{htmlSafe
                (concat
                  "background:"
                  bs.slide_bg_color
                  ";"
                  "background-image: url("
                  bs.image_url
                  ");"
                )
              }}
            >
              <div class="custom-big-carousel-content">
                <div class="custom-big-carousel-outer-wrap wrap">
                  <div
                    class="custom-big-carousel-inner-wrap"
                    style={{htmlSafe (concat "background:" bs.text_bg)}}
                  >
                    <div class="custom-big-carousel-main-content">
                      <a href={{bs.link}} class="custom-big-carousel-text-link">
                        <h2>
                          {{bs.headline}}
                        </h2>

                        <p>
                          {{bs.text}}
                        </p>
                      </a>

                      {{#if (and bs.button_text bs.link)}}
                        <a href={{bs.link}} class="btn btn-primary btn-text">
                          {{bs.button_text}}
                        </a>
                      {{/if}}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          {{/each}}

          {{#each this.bigUserSlides as |bs|}}
            <div
              class="custom-big-carousel-slide user-slide"
              style={{htmlSafe
                (concat
                  "background:"
                  bs.slide_bg_color
                  ";"
                  "background-image: url("
                  bs.image_url
                  ");"
                )
              }}
            >
              <div class="custom-big-carousel-content">
                <div class="custom-big-carousel-outer-wrap wrap">
                  <div class="custom-big-carousel-inner-wrap">
                    <div class="custom-big-carousel-main-content">
                      <h4>
                        {{bs.headline}}
                      </h4>
                      <div style={{htmlSafe (concat "background:" bs.text_bg)}}>
                        <h3>
                          <a href="/u/{{bs.user_info.user.username}}">
                            {{avatar bs.user_info.user imageSize="huge"}}
                            {{bs.user_info.user.username}}
                          </a>
                        </h3>
                      </div>

                      <p class="bs-main-text">
                        {{bs.text}}
                      </p>

                      {{#if (and bs.button_text bs.link)}}
                        <a
                          href="/u/{{bs.link}}"
                          class="btn btn-primary btn-text"
                        >
                          {{bs.button_text}}
                        </a>
                      {{/if}}
                    </div>

                    {{#if bs.user_activity}}
                      <div class="bc-user-activity">
                        <h4>Recent Activity</h4>

                        {{#each bs.user_activity as |activity|}}
                          <div class="bc-user-post">
                            <a href="/t/{{activity.topic_id}}">
                              <div class="bc-user-post-title">
                                {{activity.title}}
                              </div>
                              <p class="bc-user-post-excerpt">
                                {{htmlSafe activity.excerpt}}
                              </p>
                            </a>
                          </div>
                        {{/each}}
                      </div>
                    {{/if}}
                  </div>
                </div>
              </div>
            </div>
          {{/each}}
        </div>

        <div class="custom-big-carousel-nav">
          {{#each this.bigStaticSlides}}
            <div class="custom-big-carousel-nav-item"></div>
          {{/each}}

          {{#each this.bigUserSlides}}
            <div class="custom-big-carousel-nav-item"></div>
          {{/each}}
        </div>

        <ConditionalLoadingSpinner @condition={{this.isLoading}} />
      </div>
    {{/if}}
  </template>
}
