import type { ComponentProps } from "react";
import { vi } from "vitest";

vi.mock("next/image", () => ({
  // This mock intentionally uses a plain img for a lightweight unit test.
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  default: (props: ComponentProps<"img">) => <img {...props} />,
}));

// describe("Home page", () => {
//   it("renders the getting started heading", () => {
//     render(<Home />);

//     expect(
//       screen.getByRole("heading", {
//         level: 1,
//         name: /to get started, edit the page\.tsx file\./i,
//       }),
//     ).toBeInTheDocument();
//   });
// });
