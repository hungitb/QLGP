<template>
  <div
    ref="familyCard"
    class="family-card"
    :style="{
      paddingTop: `${config.verticalDistance}px`,
      paddingLeft: `${config.horizontalDistance / 2}px`,
      paddingRight: `${config.horizontalDistance / 2}px`,
    }"
  >
    <div class="parent">
      <PersonCard
        :person="person"
        :config="config"
        :ref="mappingPersonIdToRef[person.id]"
        :viewer="viewer"
        @addPersonRelationShipDone="handlePersonAddRelationship"
      />
      <template v-if="drawSpouse">
        <div
          v-if="person.spouseId"
          :style="{ width: config.horizontalDistance + 'px' }"
        ></div>
        <PersonCard
          v-if="person.spouseId"
          :ref="mappingPersonIdToRef[person.spouseId + sffrmfsi]"
          :person="$store.state.personMapping[person.spouseId]"
          :config="config"
          :viewer="viewer"
          @addPersonRelationShipDone="handlePersonAddRelationship"
        />

        <template
          v-for="spouseId in Object.keys(groupChildrenHasSpouseDiffFromSpouse)"
        >
          <div
            :style="{ width: config.horizontalDistance + 'px' }"
            :key="'mg' + mappingPersonIdToRef[spouseId + sffrmfsi]"
          ></div>
          <PersonCard
            :key="mappingPersonIdToRef[spouseId + sffrmfsi]"
            :ref="mappingPersonIdToRef[spouseId + sffrmfsi]"
            :person="$store.state.personMapping[spouseId]"
            :config="config"
            :viewer="viewer"
            @addPersonRelationShipDone="handlePersonAddRelationship"
          />
        </template>
      </template>
    </div>
    <div class="children">
      <FamilyCard
        v-for="child in allChildren"
        :key="mappingPersonIdToRef[child.id]"
        :ref="mappingPersonIdToRef[child.id]"
        :person="child"
        :config="config"
        :viewer="viewer"
        :_distanceWithHorizontalLineAbove="
          mappingChildIdToDistanceBetweenChildCardWithHorizentalLineAbove[
            child.id
          ]
        "
        @addPersonRelationShipDone="handlePersonAddRelationship"
      />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import $ from "jquery";

import { type ExtendedPerson } from "../../../../general/controller/person";
import PersonCard from "./PersonCard.vue";
import { Gender } from "../../../../general/model/Person";
import { type FamilyCardConfig } from "../types";

let currentNumber = 0;
function getUniqueID() {
  currentNumber++;
  return "fm" + currentNumber;
}

/**
 * Do sử dụng person id để tính ref, nhưng có thể có 1 người vừa xuất hiện ở hàng cha mẹ, vừa xuất hiện ở hàng con.
 * Khi đó có 2 card cùng ref. Vì vậy, mỗi khi get ref hoặc set ref của card spouse phải thêm hậu tố định nghĩa dưới đây.
 * Ví dụ về trường hợp trên:
 * + Ông A, không có vợ, có con C với bà B và ông này cưới luôn cả con C
 */
const sufixForRefMappingForSpouseId = "_as_spouse";
/**
 * Chiều rộng đường kẻ nối các card
 */
const lineWidth = 8;

export default Vue.extend({
  name: "FamilyCard",
  components: {
    PersonCard,
  },
  props: {
    person: {
      type: Object as () => ExtendedPerson,
      required: true,
    },
    config: {
      type: Object as () => FamilyCardConfig,
      required: true,
    },
    viewer: {
      type: Object,
    },
    // Khoảng cách với đường kẻ ngang ở trên, đường kẻ ngang nối các con khác có chung spouse phụ với person chính hiện tại
    // Thông thường đường kẻ ngang này sẽ cách verticalDistance/2 nhưng nó có thể bị giảm khi thế hệ bên trên có nhiều cụm spouse
    // Giá trị trừ 1 biểu thị rằng cứ xem giá trị là verticalDistance/2
    _distanceWithHorizontalLineAbove: {
      type: Number,
      default: -1,
    },
  },
  data() {
    return {
      Gender,
      sffrmfsi: sufixForRefMappingForSpouseId,
      drawSpouse:
        (this.config.level == 2 && this.person.gender == Gender.MALE) ||
        this.config.level >= 3,
      allChildren: [] as ExtendedPerson[],
      childrenNotKnowSpouse: [] as ExtendedPerson[],
      childrenHasSpouseSameCurrSpouse: [] as ExtendedPerson[],
      groupChildrenHasSpouseDiffFromSpouse: {} as Record<
        string,
        ExtendedPerson[]
      >,
      mappingPersonIdToRef: {} as Record<string, string>,
      mappingChildIdToDistanceBetweenChildCardWithHorizentalLineAbove:
        {} as Record<string, number>,
      lines: [] as JQuery<HTMLElement>[], /* eslint-disable-line */ // @ts-ignore
    };
  },
  methods: {
    handlePersonAddRelationship(payload: any) {
      this.$emit("addPersonRelationShipDone", payload);
    },
    drawLines() {
      if (
        (!this.drawSpouse || !this.person.spouseId) &&
        this.allChildren.length == 0
      ) {
        // Không vẽ được gì cả thì return luôn
        return;
      }

      const $familyCard = $(this.$refs.familyCard as HTMLElement);

      const drawLine = (
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        padding1 = false,
        padding2 = false
      ) => {
        let lineHeight = Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
        const lineBackground = "black";

        if (padding1) {
          // Move point 1 along the direction vector from point 2 to point 1 by (lineWidth/2) px
          lineHeight += lineWidth / 2;
          const [a, b] = [x1 - x2, y1 - y2];
          x1 += ((lineWidth / 2) * a) / Math.sqrt(a ** 2 + b ** 2);
          y1 += ((lineWidth / 2) * b) / Math.sqrt(a ** 2 + b ** 2);
        }
        if (padding2) {
          // Move point 2 along the direction vector from point 1 to point 2 by (lineWidth/2) px
          lineHeight += lineWidth / 2;
          const [a, b] = [x2 - x1, y2 - y1];
          x2 += ((lineWidth / 2) * a) / Math.sqrt(a ** 2 + b ** 2);
          y2 += ((lineWidth / 2) * b) / Math.sqrt(a ** 2 + b ** 2);
        }

        const $line = $("<div></div>").css({
          height: lineWidth + "px",
          width: lineHeight + "px",
          position: "absolute",
          left: (x1 + x2) / 2 - lineHeight / 2 + "px",
          top: (y1 + y2) / 2 - lineWidth / 2 + "px",
          transform: `rotate(${
            (Math.atan((y2 - y1) / (x2 - x1)) * 180) / Math.PI
          }deg)`,
          "background-color": lineBackground,
        });

        $familyCard.append($line);
        this.lines.push($line);
      };

      const getPersonCardElementByPersonId = (personId: string) => {
        const temp = this.$refs[this.mappingPersonIdToRef[personId]] as any;
        // Các phần tử FamilyCard khi get sẽ trả về array do nằm trong vòng for
        if (Array.isArray(temp)) {
          return temp[0].$el as HTMLElement;
        }
        return temp.$el as HTMLElement;
      };

      const $person = $(getPersonCardElementByPersonId(this.person.id));
      const pPos = $person.position();
      const pHeight = $person.outerHeight() as number;
      const pWidth = $person.outerWidth() as number;

      let horiLineY = 0;

      const getChildCardStyle = (childId: string) => {
        const $child = $(getPersonCardElementByPersonId(childId));
        let temp = $child.position();
        const top1 = temp.top,
          left1 = temp.left;

        const $childFirstPar = $child
          .children(".parent")
          .find("div:first-child");
        temp = $childFirstPar.position();
        const top2 = temp.top,
          left2 = temp.left;

        return {
          top: top1 + top2,
          left: left1 + left2,
          height: $childFirstPar.outerHeight() as number,
          width: $childFirstPar.outerWidth() as number,
        };
      };

      if (this.allChildren.length != 0) {
        horiLineY =
          (pPos.top + pHeight + getChildCardStyle(this.allChildren[0].id).top) /
          2;
      }

      const horizontalRanges: [
        startX: number,
        endX: number,
        reduceYLevel: number
      ][] = [];

      const drawConnectLinesBetweenChildrenWithAbove = (
        children: ExtendedPerson[],
        x: number,
        y: number
      ) => {
        if (children.length == 0) return;

        const mapChildIpToChildCardInfo: Record<
          string,
          {
            top: number;
            left: number;
            height: number;
            width: number;
          }
        > = {};
        children.forEach((child) => {
          mapChildIpToChildCardInfo[child.id] = getChildCardStyle(child.id);
        });
        const firstChildId = children[0].id;

        const lastHorizontalRange =
          horizontalRanges.length > 0
            ? horizontalRanges[horizontalRanges.length - 1]
            : [-10e10, -10e10, 0];

        if (children.length == 1) {
          const x2 =
            mapChildIpToChildCardInfo[firstChildId].left +
            mapChildIpToChildCardInfo[firstChildId].width / 2;
          const y2 = mapChildIpToChildCardInfo[firstChildId].top;

          if (x == x2) {
            drawLine(x, y, x2, y2);
          } else {
            const horiLineFromLeftToRight = x < x2;
            let reduceYLevel = 0;
            if (
              (horiLineFromLeftToRight &&
                x <= lastHorizontalRange[1] + lineWidth) ||
              (!horiLineFromLeftToRight &&
                x2 <= lastHorizontalRange[1] + lineWidth)
            ) {
              reduceYLevel =
                lastHorizontalRange[2] + (horiLineFromLeftToRight ? 1 : -1);
            }
            let reduceY = 0;
            if (reduceYLevel > 0) {
              reduceY =
                this.config.verticalDistance / 2 -
                this.config.verticalDistance / 2 / 2 ** reduceYLevel;
            } else if (reduceYLevel < 0) {
              reduceY = -(
                this.config.verticalDistance / 2 -
                this.config.verticalDistance / 2 / 2 ** -reduceYLevel
              );
            }

            drawLine(x, y, x, horiLineY - reduceY, false, false);
            drawLine(
              x,
              horiLineY - reduceY,
              x2,
              horiLineY - reduceY,
              true,
              true
            );
            drawLine(x2, horiLineY - reduceY, x2, y2, false, false);

            // Refresh child card
            if (reduceY != 0) {
              Vue.set(
                this
                  .mappingChildIdToDistanceBetweenChildCardWithHorizentalLineAbove,
                firstChildId,
                this.config.verticalDistance / 2 + reduceY
              );
            }

            horizontalRanges.push(
              horiLineFromLeftToRight
                ? [x, x2, reduceYLevel]
                : [x2, x, reduceYLevel]
            );
          }
        } else {
          const horiLineX1 =
            mapChildIpToChildCardInfo[firstChildId].left +
            mapChildIpToChildCardInfo[firstChildId].width / 2;
          const lastChildId = children[children.length - 1].id;
          const horiLineX2 =
            mapChildIpToChildCardInfo[lastChildId].left +
            mapChildIpToChildCardInfo[lastChildId].width / 2;

          const minX = Math.min(horiLineX1, horiLineX2, x);
          const maxX = Math.max(horiLineX1, horiLineX2, x);

          let reduceYLevel = 0;
          if (minX <= lastHorizontalRange[1]) {
            reduceYLevel = lastHorizontalRange[2] + (x < horiLineX1 ? 1 : -1);
          }
          let reduceY = 0;
          if (reduceYLevel > 0) {
            reduceY =
              this.config.verticalDistance / 2 -
              this.config.verticalDistance / 2 / 2 ** reduceYLevel;
          } else if (reduceYLevel < 0) {
            reduceY = -(
              this.config.verticalDistance / 2 -
              this.config.verticalDistance / 2 / 2 ** -reduceYLevel
            );
          }

          if (horiLineX1 <= x && x <= horiLineX2) {
            drawLine(x, y, x, horiLineY - reduceY, false, false);
          } else {
            drawLine(x, y, x, horiLineY - reduceY, false, false);
            drawLine(
              x,
              horiLineY - reduceY,
              (horiLineX1 + horiLineX2) / 2,
              horiLineY - reduceY,
              true,
              true
            );
          }
          drawLine(
            horiLineX1,
            horiLineY - reduceY,
            horiLineX2,
            horiLineY - reduceY,
            true,
            true
          );

          children.forEach((child) => {
            const vertLineX =
              mapChildIpToChildCardInfo[child.id].left +
              mapChildIpToChildCardInfo[child.id].width / 2;
            const vertLineY1 = horiLineY - reduceY;
            const vertLineY2 = mapChildIpToChildCardInfo[child.id].top;

            // Refresh child card
            if (reduceY != 0) {
              Vue.set(
                this
                  .mappingChildIdToDistanceBetweenChildCardWithHorizentalLineAbove,
                child.id,
                this.config.verticalDistance / 2 + reduceY
              );
            }

            drawLine(
              vertLineX,
              vertLineY1,
              vertLineX,
              vertLineY2,
              false,
              false
            );
          });

          horizontalRanges.push([minX, maxX, reduceYLevel]);
        }
      };

      // Doesnot draw spouse
      if (!this.drawSpouse) {
        drawConnectLinesBetweenChildrenWithAbove(
          this.allChildren,
          pPos.left + pWidth / 2,
          pPos.top + pHeight
        );
        return;
      }

      // Draw spouse is condition to below

      // Draw children has no spouse
      if (this.childrenNotKnowSpouse.length != 0) {
        drawConnectLinesBetweenChildrenWithAbove(
          this.childrenNotKnowSpouse,
          pPos.left + pWidth / 2,
          pPos.top + pHeight
        );
      }

      // Draw children has same spouse
      if (this.person.spouseId) {
        const $spouseCard = $(
          getPersonCardElementByPersonId(
            this.person.spouseId + sufixForRefMappingForSpouseId
          )
        );
        const x1 = pPos.left + pWidth;
        const x2 = $spouseCard.position().left;
        const y = pPos.top + pHeight / 2;
        drawLine(x1, y, x2, y);

        drawConnectLinesBetweenChildrenWithAbove(
          this.childrenHasSpouseSameCurrSpouse,
          (x1 + x2) / 2,
          y
        );
      }

      // Draw children has spouse difference from spouse
      const spouseIdsHasChildWithButDiffCurrSpouse = Object.keys(
        this.groupChildrenHasSpouseDiffFromSpouse
      );
      const numPartnersDiffFromSpouse =
        spouseIdsHasChildWithButDiffCurrSpouse.length;
      spouseIdsHasChildWithButDiffCurrSpouse.forEach((spouseId, index) => {
        const $spouseCard = $(
          getPersonCardElementByPersonId(
            spouseId + sufixForRefMappingForSpouseId
          )
        );
        const spousePos = $spouseCard.position();
        const spouseWidth = $spouseCard.outerWidth() as number;

        const x1 = pPos.left + pWidth / 2;
        const x2 = spousePos.left + spouseWidth / 2;
        const y =
          pPos.top -
          ((index + 1) / (numPartnersDiffFromSpouse + 1)) *
            (this._distanceWithHorizontalLineAbove == -1
              ? this.config.verticalDistance / 2
              : this._distanceWithHorizontalLineAbove);
        drawLine(x1, y, x2, y, true, true);

        drawLine(x1, y, x1, pPos.top, true, false);
        drawLine(x2, y, x2, pPos.top, true, false);

        drawConnectLinesBetweenChildrenWithAbove(
          this.groupChildrenHasSpouseDiffFromSpouse[spouseId],
          x2 - spouseWidth / 2 - this.config.horizontalDistance / 2,
          y
        );
      });
    },
    removeLines() {
      this.lines.forEach((line) => line.remove());
    },
    transformData() {
      const mappingPersonIdToRef: Record<string, string> = {};
      const mappingChildIdToDistanceBetweenChildCardWithHorizentalLineAbove: Record<
        string,
        number
      > = {};
      const allChildren: ExtendedPerson[] = [];
      const childrenNotKnowSpouse: ExtendedPerson[] = [];
      const childrenHasSpouseSameCurrSpouse: ExtendedPerson[] = [];
      const groupChildrenHasSpouseDiffFromSpouse: Record<
        string,
        ExtendedPerson[]
      > = {};

      mappingPersonIdToRef[this.person.id] = getUniqueID();
      if (this.person.spouseId)
        mappingPersonIdToRef[
          this.person.spouseId + sufixForRefMappingForSpouseId
        ] = getUniqueID();

      this.person.children.forEach(({ child, spouseId }) => {
        mappingPersonIdToRef[child.id] = getUniqueID();
        mappingChildIdToDistanceBetweenChildCardWithHorizentalLineAbove[
          child.id
        ] = -1;

        if (spouseId) {
          mappingPersonIdToRef[spouseId + sufixForRefMappingForSpouseId] =
            getUniqueID();
          if (spouseId == this.person.spouseId) {
            childrenHasSpouseSameCurrSpouse.push(child);
          } else {
            if (groupChildrenHasSpouseDiffFromSpouse[spouseId]) {
              groupChildrenHasSpouseDiffFromSpouse[spouseId].push(child);
            } else {
              groupChildrenHasSpouseDiffFromSpouse[spouseId] = [child];
            }
          }
        } else {
          childrenNotKnowSpouse.push(child);
        }
      });

      for (const children of [
        childrenNotKnowSpouse,
        childrenHasSpouseSameCurrSpouse,
        ...Object.values(groupChildrenHasSpouseDiffFromSpouse),
      ]) {
        children.forEach((child) => allChildren.push(child));
      }

      this.allChildren = allChildren;
      this.childrenNotKnowSpouse = childrenNotKnowSpouse;
      this.childrenHasSpouseSameCurrSpouse = childrenHasSpouseSameCurrSpouse;
      this.groupChildrenHasSpouseDiffFromSpouse =
        groupChildrenHasSpouseDiffFromSpouse;
      this.mappingPersonIdToRef = mappingPersonIdToRef;
      this.mappingChildIdToDistanceBetweenChildCardWithHorizentalLineAbove =
        mappingChildIdToDistanceBetweenChildCardWithHorizentalLineAbove;
    },
    /**
     * Tìm HTML Elemnt Card của personId.
     * Có thể sẽ có nhiều card hợp lệ do 1 người có thể xuất hiện nhiều lần.
     * Vì vậy sẽ ưu tiên người ở vị chí chính, rồi mới đến người ở vị trí spouse
     */
    findCardElementByPersonId(
      personId: string
    ): [element: HTMLElement | null, asSpouse: boolean] {
      if (this.person.id == personId) {
        return [
          (this.$refs as any)[this.mappingPersonIdToRef[personId]]
            .$el as HTMLElement,
          false,
        ];
      }

      let foundElement: HTMLElement | null = null;

      for (const child of this.allChildren) {
        const childRef = this.mappingPersonIdToRef[child.id];
        let childCardComponent = this.$refs[childRef] as any;
        if (Array.isArray(childCardComponent)) {
          // Có thể là Array nếu được gen từ v-if
          childCardComponent = childCardComponent[0];
        }
        const [element, asSpouse]: [
          element: HTMLElement | null,
          asSpouse: boolean
        ] = childCardComponent.findCardElementByPersonId(personId);
        if (element) {
          if (!asSpouse) {
            return [element, false];
          }

          foundElement = element;
        }
      }

      if (foundElement) {
        return [foundElement, true];
      }

      for (const spouseId of [
        this.person.spouseId,
        ...Object.keys(this.groupChildrenHasSpouseDiffFromSpouse),
      ]) {
        if (spouseId == personId) {
          let spouseCardComponent = (this.$refs as any)[
            this.mappingPersonIdToRef[personId + sufixForRefMappingForSpouseId]
          ];
          if (Array.isArray(spouseCardComponent))
            spouseCardComponent = spouseCardComponent[0];
          // Có thể sẽ null do điều kiện vẽ, ví dụ khi level quá bé.
          // Cái mappingPersonIdToRef chỉ là tính trước thôi chứ có thể sẽ có person không vẽ
          if (spouseCardComponent) {
            return [spouseCardComponent.$el as HTMLElement, true];
          }
        }
      }

      return [null, false];
    },
  },
  watch: {
    _distanceWithHorizontalLineAbove() {
      this.removeLines();
      this.drawLines();
    },
  },
  created() {
    this.transformData();
  },
  mounted() {
    this.drawLines();
  },
});
</script>

<style lang="scss">
.family-card {
  width: max-content;
  position: relative;

  .parent {
    display: flex;
    justify-content: center;
  }

  .children {
    display: flex;
    width: max-content;
  }
}
</style>
