<template>
  <div ref="viewer" class="viewer">
    <div ref="content" class="content">
      <div ref="wrapper" class="wrapper">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import $ from "jquery";
import Hammer from "hammerjs";
import { checkIfIsMobile } from "@/utils";

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

function processDuration(duration: number) {
  if (duration < 1000) {
    duration = 1000 * Math.pow(duration / 1000, 1 / 6);
  }
  duration = 1000 * Math.pow(duration / 1000, 1 / 2);

  return duration;
}

export default Vue.extend({
  data() {
    return {
      interval: undefined as number | undefined,
      contentElement: null as HTMLElement | null,
      wrapperElement: null as HTMLElement | null,
      contentBCR: getDefaultBCR(),
      state: {
        scale: 1,
        translateX: 0,
        translateY: 0,
        scaleStart: 1,

        // Để kiểm tra click event
        panStart: {
          clientX: 0,
          clientY: 0,
        },
        panEnd: {
          clientX: 0,
          clientY: 0,
        },
      },
      ticking: false,
      mc: null as any,
      lastPinchEventEndTimestamp: 0,
    };
  },
  methods: {
    updateElementTransform() {
      if (this.wrapperElement) {
        const values = [
          `translateX(${this.state.translateX}px)`,
          `translateY(${this.state.translateY}px)`,
          `scale(${this.state.scale})`,
        ];

        this.wrapperElement.style.transform = values.join(" ");
      }
    },
    requestElementUpdate() {
      if (!this.ticking) {
        requestAnimationFrame(() => {
          this.updateElementTransform();
          this.ticking = false;
        });

        this.ticking = true;
      }
    },
    moveRelative(x: number, y: number) {
      this.state.translateX += x;
      this.state.translateY += y;

      this.requestElementUpdate();
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

      this.requestElementUpdate();
    },
    isClickEvent() {
      const delta = 10;

      return (
        Math.abs(this.state.panStart.clientX - this.state.panEnd.clientX) <
          delta &&
        Math.abs(this.state.panStart.clientY - this.state.panEnd.clientY) <
          delta
      );
    },
    focusElement(element: HTMLElement, speed?: number) {
      // to do: Check if viewer conatins element, if not then return.

      const elementBCR = element.getBoundingClientRect();
      this.refreshBCROfElements();

      const deltaX =
        this.contentBCR.x +
        this.contentBCR.width / 2 -
        elementBCR.x -
        elementBCR.width / 2;

      const deltaY =
        this.contentBCR.y +
        this.contentBCR.height / 2 -
        elementBCR.y -
        elementBCR.height / 2;

      if (!this.wrapperElement) {
        return Promise.resolve();
      }

      if (!speed || (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1)) {
        this.moveRelative(deltaX, deltaY);
        return Promise.resolve();
      }

      const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);
      const duration = processDuration(distance / speed);

      return new Promise<void>((resolve) => {
        $({
          translateX: this.state.translateX,
          translateY: this.state.translateY,
        }).animate(
          {
            translateX: this.state.translateX + deltaX,
            translateY: this.state.translateY + deltaY,
          },
          {
            duration,
            step: (now, fx) => {
              this.state[fx.prop] = now;
              this.updateElementTransform();
            },
            done: () => {
              resolve();
            },
          }
        );
      });
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
    onPan(e: any) {
      if (checkIfIsMobile()) {
        // Trên mobile, sau khi pinch thì phải nghỉ 100 ms rồi mới unlock pan event
        // Tránh tình trạng dễ bị giật hình trên mobile
        if (new Date().getTime() - this.lastPinchEventEndTimestamp < 100) {
          return;
        }
      }

      if (e.type == "panstart") {
        this.state.panStart = {
          clientX: this.state.translateX,
          clientY: this.state.translateY,
        };
      }

      if (e.type == "panend") {
        this.state.panEnd = {
          clientX: this.state.translateX,
          clientY: this.state.translateY,
        };
        setTimeout(() => {
          // Set cho bằng panStart để click hoạt động trở lại
          this.state.panEnd = {
            clientX: this.state.panStart.clientX,
            clientY: this.state.panStart.clientY,
          };
        }, 100);
        return;
      }

      this.state.translateX = this.state.panStart.clientX + e.deltaX;
      this.state.translateY = this.state.panStart.clientY + e.deltaY;

      this.requestElementUpdate();
    },
    onPinch(e: any) {
      if (e.type == "pinchstart") {
        this.state.scaleStart = 1;
      }

      this.scale(e.scale / this.state.scaleStart, {
        clientX: e.center.x,
        clientY: e.center.y,
      });

      this.state.scaleStart = e.scale;
      this.lastPinchEventEndTimestamp = new Date().getTime();
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

    const mc = new Hammer.Manager(this.contentElement);
    mc.add(new Hammer.Pinch({ threshold: 0 }));
    mc.add(new Hammer.Pan({ threshold: 0, pointers: 0 }));
    mc.on("pinchstart pinchmove", this.onPinch);
    mc.on("panstart panmove panend", this.onPan);
    this.mc = mc;

    this.contentElement.addEventListener("wheel", this.onWheel);

    this.refreshBCROfElements();
    setTimeout(this.refreshBCROfElements, 100);
    this.interval = setInterval(this.refreshBCROfElements, 1000);
  },
  beforeDestroy() {
    if (this.contentElement) {
      this.contentElement.removeEventListener("wheel", this.onWheel);
    }

    const mc = this.mc!;
    mc.off("pinchstart pinchmove");
    mc.off("panstart panmove panend");
    mc.remove(mc.get("pan"));
    mc.remove(mc.get("pinch"));

    clearInterval(this.interval);
  },
});
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
</style>
