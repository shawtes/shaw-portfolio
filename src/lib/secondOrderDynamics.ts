/**
 * Second Order Dynamics — spring-based animation system
 * Inspired by Lusion's approach for smooth, physically-based interpolation
 * f = frequency (speed), z = damping, r = response (overshoot)
 */
export class SecondOrderDynamics {
  private xp: number;
  private y: number;
  private yd: number;
  private k1: number;
  private k2: number;
  private k3: number;

  constructor(f: number, z: number, r: number, x0: number = 0) {
    this.k1 = z / (Math.PI * f);
    this.k2 = 1 / ((2 * Math.PI * f) * (2 * Math.PI * f));
    this.k3 = (r * z) / (2 * Math.PI * f);
    this.xp = x0;
    this.y = x0;
    this.yd = 0;
  }

  update(dt: number, x: number): number {
    if (dt === 0) return this.y;
    const xd = (x - this.xp) / dt;
    this.xp = x;

    const k2Stable = Math.max(this.k2, (dt * dt) / 2 + (dt * this.k1) / 2, dt * this.k1);

    this.y = this.y + dt * this.yd;
    this.yd = this.yd + (dt * (x + this.k3 * xd - this.y - this.k1 * this.yd)) / k2Stable;

    return this.y;
  }

  set(value: number): void {
    this.xp = value;
    this.y = value;
    this.yd = 0;
  }

  get value(): number {
    return this.y;
  }
}
