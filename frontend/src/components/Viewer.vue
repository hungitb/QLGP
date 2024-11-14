<template>
  <div ref="viewer" :class="'viewer' + (isMobile ? ' viewer-mobile' : '')">
    <div ref="content" class="content">
      <div ref="wrapper" class="wrapper">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { checkIfIsMobile } from "@/utils";
import Vue from "vue";

type Point = {
  clientX: number;
  clientY: number;
};
const getDefaultBCR = () =>
  ({
    bottom: 0,
    height: 0,
    left: 0,
    right: 0,
    top: 0,
    width: 0,
    x: 0,
    y: 0,
  } as DOMRect);

function assignDOMRect(dest: Record<string, any>, src: DOMRect) {
  for (let key of [
    "bottom",
    "height",
    "left",
    "right",
    "top",
    "width",
    "x",
    "y",
  ]) {
    dest[key] = src[key as keyof DOMRect];
  }
}

function processScale(scale: number) {
  if (isNaN(scale)) return 1;
  else if (scale < 0.005) return 0.005;
  else if (scale > 10) return 10;
  return scale;
}

const ViewerPC = Vue.extend({
  data() {
    return {
      mustTriggerZoomManually: false,
      isMobile: false,
      interval: undefined as number | undefined,
      contentElement: null as HTMLElement | null,
      wrapperElement: null as HTMLElement | null,
      contentBCR: getDefaultBCR(),
      state: {
        scale: 1,
        translateX: 0,
        translateY: 0,

        panning: false,
        panningStart: {
          clientX: 0,
          clientY: 0,
        } as Point,
      },
    };
  },
  methods: {
    render() {
      if (this.wrapperElement) {
        this.wrapperElement.style.transform = `translateX(${this.state.translateX}px) translateY(${this.state.translateY}px) scale(${this.state.scale})`;
      }
    },
    moveRelative(x: number, y: number) {
      this.state.translateX += x;
      this.state.translateY += y;

      this.render();
    },
    scale(raito: number, pivot?: Point) {
      if (!pivot) {
        // Center of viewer
        pivot = {
          clientX: this.contentBCR.x + this.contentBCR.width / 2,
          clientY: this.contentBCR.y + this.contentBCR.height / 2,
        };
      }

      const newScale = processScale(this.state.scale * raito);

      const wrapperCenter: Point = {
        clientX:
          this.contentBCR.x + this.contentBCR.width / 2 + this.state.translateX,
        clientY:
          this.contentBCR.y +
          this.contentBCR.height / 2 +
          this.state.translateY,
      };

      const oldScale = this.state.scale;

      this.state.translateX +=
        (newScale / oldScale - 1) * (wrapperCenter.clientX - pivot.clientX);
      this.state.translateY +=
        (newScale / oldScale - 1) * (wrapperCenter.clientY - pivot.clientY);
      this.state.scale = newScale;

      this.render();
    },
    onWheel(event: WheelEvent) {
      event.preventDefault();
      let delta = 1;

      if (event.deltaY) {
        delta = event.deltaY > 0 ? 1 : -1;
      } else if ((event as any).wheelDelta) {
        delta = -(event as any).wheelDelta / 120;
      } else if (event.detail) {
        delta = event.detail > 0 ? 1 : -1;
      }

      this.scale(1 - delta * 0.1, {
        clientX: event.clientX,
        clientY: event.clientY,
      });
    },
    onMousedown(event: MouseEvent) {
      event.preventDefault();

      this.state.panning = true;

      this.state.panningStart = {
        clientX: event.clientX,
        clientY: event.clientY,
      };
    },
    onMouseup(event: MouseEvent) {
      event.preventDefault();

      this.state.panning = false;
    },
    onMousemove(event: MouseEvent) {
      event.preventDefault();
      if (!this.state.panning) return;

      // to do: Check if mouse from outer then set panning to false

      this.moveRelative(
        event.clientX - this.state.panningStart.clientX,
        event.clientY - this.state.panningStart.clientY
      );

      this.state.panningStart = {
        clientX: event.clientX,
        clientY: event.clientY,
      };
    },
    refreshBCROfElements() {
      if (this.contentElement) {
        assignDOMRect(
          this.contentBCR,
          this.contentElement.getBoundingClientRect()
        );
      }
    },
  },
  mounted() {
    this.contentElement = (this.$refs as any).content as HTMLElement;
    this.wrapperElement = (this.$refs as any).wrapper as HTMLElement;

    this.contentElement.addEventListener("wheel", this.onWheel);
    this.contentElement.addEventListener("mousedown", this.onMousedown);
    this.contentElement.addEventListener("mouseup", this.onMouseup);
    this.contentElement.addEventListener("mousemove", this.onMousemove);

    setTimeout(this.refreshBCROfElements, 100);
    this.interval = setInterval(this.refreshBCROfElements, 1000);
  },
  beforeDestroy() {
    if (this.contentElement) {
      this.contentElement.removeEventListener("wheel", this.onWheel);
      this.contentElement.removeEventListener("mousedown", this.onMousedown);
      this.contentElement.removeEventListener("mouseup", this.onMouseup);
      this.contentElement.removeEventListener("mousemove", this.onMousemove);
    }

    clearInterval(this.interval);
  },
});

const ViewerMobile = Vue.extend({
  data() {
    return {
      mustTriggerZoomManually: true,
      interval: undefined as number | undefined,
      isMobile: true,
      viewerElement: null as HTMLElement | null,
      contentElement: null as HTMLElement | null,
      wrapperElement: null as HTMLElement | null,
      viewerBCR: getDefaultBCR(),

      state: {
        scale: 1,
      },
    };
  },
  methods: {
    scale(raito: number, pivot?: Point) {
      if (this.wrapperElement && this.contentElement && this.viewerElement) {
        if (!pivot) {
          // Center of viewer
          pivot = {
            clientX: this.viewerBCR.x + this.viewerBCR.width / 2,
            clientY: this.viewerBCR.y + this.viewerBCR.height / 2,
          };
        }

        const newScale = processScale(this.state.scale * raito);

        const oldWrapperBCR = this.wrapperElement.getBoundingClientRect();
        this.wrapperElement.style.transform = `scale(${newScale})`;
        const newWrapperBCR = this.wrapperElement.getBoundingClientRect();
        Object.assign(this.contentElement.style, {
          height: newWrapperBCR.height + "px",
          width: newWrapperBCR.width + "px",
        });

        const oldScale = this.state.scale;

        this.viewerElement.scrollLeft =
          ((pivot.clientX - oldWrapperBCR.x) * newScale) / oldScale -
          (pivot.clientX - this.viewerBCR.x);
        this.viewerElement.scrollTop =
          ((pivot.clientY - oldWrapperBCR.y) * newScale) / oldScale -
          (pivot.clientY - this.viewerBCR.y);
        this.state.scale = newScale;
      }
    },
    onClick(event: MouseEvent) {
      this.scale((window as any).a ? 1 / 1.1 : 1.1, {
        clientX: event.clientX,
        clientY: event.clientY,
      });
    },
    refreshBCROfElements() {
      if (this.viewerElement) {
        assignDOMRect(
          this.viewerBCR,
          this.viewerElement.getBoundingClientRect()
        );
      }
    },
  },
  mounted() {
    this.viewerElement = (this.$refs as any).viewer as HTMLElement;
    this.contentElement = (this.$refs as any).content as HTMLElement;
    this.wrapperElement = (this.$refs as any).wrapper as HTMLElement;

    this.contentElement.addEventListener("click", this.onClick);

    const wrapperBCR = this.wrapperElement.getBoundingClientRect();
    Object.assign(this.contentElement.style, {
      height: wrapperBCR.height + "px",
      width: wrapperBCR.width + "px",
    });

    setTimeout(this.refreshBCROfElements, 100);
    this.interval = setInterval(this.refreshBCROfElements, 1000);
  },
  beforeDestroy() {
    if (this.contentElement) {
      this.contentElement.removeEventListener("click", this.onClick);
    }

    clearInterval(this.interval);
  },
});

export default checkIfIsMobile() ? ViewerMobile : ViewerPC;
</script>

<style lang="scss">
.viewer:not(.viewer-mobile) {
  .content {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    cursor: grab;

    .wrapper {
      width: max-content;
      height: max-content;
    }
  }
}

.viewer.viewer-mobile {
  overflow: auto;

  .content {
    min-height: 100%;
    min-width: 100%;

    display: flex;
    justify-content: center;
    align-items: center;
  }
}
</style>
