import Component from "@ember/component";
import { classNames } from "@ember-decorators/component";
import { eq } from "truth-helpers";
import BigCarousel from "../../components/big-carousel";

@classNames("above-main-container-outlet", "big-connector")
export default class BigConnector extends Component {
  <template>
    {{#if (eq settings.plugin_outlet "above-main-container")}}
      <BigCarousel />
    {{/if}}
  </template>
}
