import { Eventable } from "./eventable";

export class Mouse extends Eventable {
  constructor() {
    super();
    this.attach();
  }
  attach() {
    if (typeof window !== "undefined") {
      this.handleMouseMove = (e) => {
        const x = (e.clientX / document.body.clientWidth) * 2 - 1;
        const y = (e.clientY / document.body.clientHeight) * 2 - 1;
        this.trigger("move", x, y);
      };
      document.addEventListener("mousemove", this.handleMouseMove);
    }
  }
  detach() {
    if (typeof window !== "undefined") {
      document.removeEventListener("mousemove", this.handleMouseMove);
    }
  }
}
