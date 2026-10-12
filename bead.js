/* Bead: the two loose pixels of Studio G01 as a small living element.
 * Same model as motion/bead.py: always two pixels in a 2 x 2 block, which slides
 * along one diagonal track (4 steps up-right, 4 down-left), moving one pixel
 * one cell per 0.1 s tick. No dependencies.
 *
 *   const bead = new Bead(container, { unit: 8, color: "#00468D" });
 *   bead.look(dx, dy) / bead.setPos(-4..4) / bead.surprise() / bead.happy()
 *   bead.loading(true|false) / bead.spin(true|false) / bead.sleep() / bead.wake()
 */
(function (global) {
  "use strict";
  const TICK = 100;
  const POSES = {
    rest: [[1, 0], [0, 1]], rest2: [[0, 0], [1, 1]],
    left: [[0, 0], [0, 1]], right: [[1, 0], [1, 1]],
    up: [[0, 0], [1, 0]], down: [[0, 1], [1, 1]],
    sleep: [[0, 1], [0, 1]],
  };
  const SPIN = ["up", "right", "down", "left"];   // one pixel jumps diagonally per step
  const OFF = 4;                       // track and stretch fit in cells -4..5
  const SPAN = 10;
  const sign = (v) => (v > 0) - (v < 0);

  function target(pose, pos, stretch) {
    const [[ax, ay], [bx, by]] = POSES[pose];
    return [[pos + ax + stretch, -pos + ay - stretch], [pos + bx - stretch, -pos + by + stretch]];
  }

  function stepTowards(cur, tgt) {
    // the two pixels are identical: each goes to the nearer target, so a quarter
    // turn in the 2 x 2 block is one diagonal jump of one pixel
    const d = (p, q) => Math.max(Math.abs(p[0] - q[0]), Math.abs(p[1] - q[1]));
    if (d(cur[0], tgt[1]) + d(cur[1], tgt[0]) < d(cur[0], tgt[0]) + d(cur[1], tgt[1])) tgt = [tgt[1], tgt[0]];
    const moves = [];
    for (const i of [0, 1]) {
      const [x, y] = cur[i], [tx, ty] = tgt[i];
      if (x !== tx || y !== ty) moves.push([i, [x + sign(tx - x), y + sign(ty - y)]]);
    }
    if (!moves.length) return false;
    const sharingOk = tgt[0][0] === tgt[1][0] && tgt[0][1] === tgt[1][1];
    for (const [i, n] of moves) {
      const o = cur[1 - i];
      if (sharingOk || n[0] !== o[0] || n[1] !== o[1]) { cur[i] = n; return true; }
    }
    cur[moves[0][0]] = moves[0][1];
    return true;
  }

  class Bead {
    constructor(el, opts = {}) {
      this.el = el;
      this.unit = opts.unit || 8;
      this.color = opts.color || "#00468D";
      this.state = { pose: "rest", pos: 0, stretch: 0 };
      this.cur = target("rest", 0, 0);
      this.idleSince = performance.now();
      this.breath = 0;
      this.loadingOn = false;
      this.reduced = global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (getComputedStyle(el).position === "static") el.style.position = "relative";
      el.style.width = el.style.height = SPAN * this.unit + "px";
      el.setAttribute("aria-hidden", "true");
      this.px = [0, 1].map(() => {
        const d = document.createElement("div");
        Object.assign(d.style, { position: "absolute", width: this.unit + "px", height: this.unit + "px", background: this.color });
        el.appendChild(d);
        return d;
      });
      this.draw();
      if (!this.reduced) this.timer = setInterval(() => this.tick(), TICK);
    }

    set(changes) {
      if (this.state.pose === "sleep" && !("pose" in changes)) this.state.pose = "rest";   // anything wakes it
      Object.assign(this.state, changes);
      this.idleSince = performance.now();
    }
    look(dx, dy) {
      if (this.state.pose === "sleep") this.wake();
      const pose = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "left" : "right") : (dy < 0 ? "up" : "down");
      this.set({ pose });
    }
    rest() { this.set({ pose: "rest" }); }
    setPos(p) { this.set({ pos: Math.max(-4, Math.min(4, Math.round(p))) }); }
    surprise() { this.set({ stretch: 3 }); clearTimeout(this.t1); this.t1 = setTimeout(() => this.set({ stretch: 0 }), 700); }
    happy() {
      const p = this.state.pos;
      this.setPos(p + 1); clearTimeout(this.t2); this.t2 = setTimeout(() => this.setPos(p), 500);
    }
    loading(on) { this.loadingOn = on; if (on) this.set({ pos: -4, pose: "rest" }); }
    spin(on) { this.spinning = on; this.set({ pose: on ? "up" : "rest", stretch: 0 }); }
    sleep() { this.set({ pose: "sleep", stretch: 0 }); }
    wake() { this.set({ pose: "rest" }); }

    tick() {
      const now = performance.now(), s = this.state;
      if (this.spinning) {
        if (this.done()) s.pose = SPIN[(SPIN.indexOf(s.pose) + 1) % 4];   // turn a quarter
        this.idleSince = now;
      } else if (this.loadingOn && this.done()) {
        s.pos = s.pos >= 4 ? -4 : s.pos + 1;       // climb the stair, drop back, again
      } else if (!this.loadingOn && s.pose !== "sleep" && now - this.idleSince > 20000) {
        s.pose = "sleep";                         // nothing happening for a while
      } else if (!this.loadingOn && ["left", "right", "up", "down"].includes(s.pose) && now - this.idleSince > 1500) {
        s.pose = "rest";                          // stopped looking: back to the stair
      } else if (!this.loadingOn && s.pose.startsWith("rest") && now - this.idleSince > 1500 && this.done()) {
        if (++this.breath % 12 === 0) s.pose = s.pose === "rest" ? "rest2" : "rest";   // breathing
      }
      if (stepTowards(this.cur, target(s.pose, s.pos, s.stretch))) this.draw();
    }
    done() {
      const t = target(this.state.pose, this.state.pos, this.state.stretch);
      const eq = (p, q) => p[0] === q[0] && p[1] === q[1];
      const [a, b] = this.cur;                    // the pixels are identical, so either order counts
      return (eq(a, t[0]) && eq(b, t[1])) || (eq(a, t[1]) && eq(b, t[0]));
    }
    draw() {
      this.cur.forEach(([x, y], i) => {
        this.px[i].style.left = (x + OFF) * this.unit + "px";
        this.px[i].style.top = (y + OFF) * this.unit + "px";
      });
    }
  }

  global.Bead = Bead;
})(window);
