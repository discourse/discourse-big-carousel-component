import Component from "@ember/component";
import { classNames } from "@ember-decorators/component";
import { eq } from "truth-helpers";
import BigCarousel from "../../components/big-carousel";

@classNames("below-site-header-outlet", "big-connector")
export default class BigConnector extends Component {
  <template>
    {{#if (eq settings.plugin_outlet "below-site-header")}}
      <BigCarousel />
    {{/if}}
  </template>
}
