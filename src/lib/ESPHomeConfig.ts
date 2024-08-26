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
    type: "bool" | "int";
    initial_value: unknown;
    // for us
    value?: unknown;
  }[];
}
