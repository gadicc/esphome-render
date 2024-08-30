export interface ESPHomeConfig {
  [key: string]: unknown;

  display: [
    {
      platform: string;
      model: string;
      lambda?: string;
      pages?: {
        id: string;
        lambda: string;
      }[];
    },
  ];

  globals: {
    id: string;
    type: "bool" | "int" | "std::string";
    initial_value: unknown;
    // for us
    value?: unknown;
  }[];

  // https://esphome.io/components/font#display-fonts
  font: {
    file: string;
    // { path: string; type: "local" | "gfonts" | "web"; },
    // gfonts: { family: string; italic?: boolean; weight?: number; }
    // web: { url: string; }
    id: string;
    /** The size of the font in pt (not pixel!). If you want to use the same font in different sizes, create two font objects. Note: size is ignored by bitmap fonts. Defaults to 20. */
    size?: number;
    /** The bit depth of the rendered font from OpenType/TrueType, for anti-aliasing. Can be 1, 2, 4, 8. Defaults to 1. */
    bpp?: number;
    glyphs?: string;
    // extras;
    _fontFamily?: string; // internal
  }[];

  // https://esphome.io/components/display/#color
  // https://esphome.io/api/structesphome_1_1_color
  // https://esphome.io/api/color_8h_source
  color: {
    id: string;
    red?: string;
    red_int?: number;
    green?: string;
    green_int?: number;
    blue?: string;
    blue_int?: number;
    white?: string;
    white_int?: number;
    hex?: string;
  }[];
}
