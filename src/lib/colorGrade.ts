import { Effect } from "postprocessing";
import { Uniform } from "three";

const fragmentShader = `
uniform float exposure;
uniform float amber;
uniform float cool;
uniform float contrast;
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec3 color = max(inputColor.rgb, vec3(0.0)) * exposure;
  float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  float warmth = smoothstep(0.02, 0.2, color.r - color.b);
  vec3 ambered = color * vec3(1.0 + amber, 1.0 + amber * 0.22, 1.0 - amber * 0.55);
  color = mix(color, ambered, warmth * smoothstep(0.02, 0.14, luma));
  float chill = smoothstep(0.02, 0.18, color.b - color.r);
  vec3 cooled = color * vec3(1.0 - cool * 0.28, 1.0 - cool * 0.05, 1.0 + cool * 0.22);
  color = mix(color, cooled, chill);
  color = max((color - vec3(0.04)) * (1.0 + contrast) + vec3(0.04), 0.0);
  outputColor = vec4(color, inputColor.a);
}
`;

/** Split grade: amber where the candles already warm the frame, blue where the window leads. */
export class GradeEffect extends Effect {
  constructor({
    exposure = 0.8,
    amber = 0.08,
    cool = 0.18,
    contrast = 0.03,
  }: {
    exposure?: number;
    amber?: number;
    cool?: number;
    contrast?: number;
  } = {}) {
    super("GradeEffect", fragmentShader, {
      uniforms: new Map<string, Uniform>([
        ["exposure", new Uniform(exposure)],
        ["amber", new Uniform(amber)],
        ["cool", new Uniform(cool)],
        ["contrast", new Uniform(contrast)],
      ]),
    });
  }

  private uniform(name: string) {
    const uniform = this.uniforms.get(name);
    if (!uniform) throw new Error(`Missing grade uniform ${name}`);
    return uniform;
  }

  get exposure() {
    return this.uniform("exposure").value as number;
  }
  set exposure(value: number) {
    this.uniform("exposure").value = value;
  }
  get amber() {
    return this.uniform("amber").value as number;
  }
  set amber(value: number) {
    this.uniform("amber").value = value;
  }
  get cool() {
    return this.uniform("cool").value as number;
  }
  set cool(value: number) {
    this.uniform("cool").value = value;
  }
  get contrast() {
    return this.uniform("contrast").value as number;
  }
  set contrast(value: number) {
    this.uniform("contrast").value = value;
  }
}
