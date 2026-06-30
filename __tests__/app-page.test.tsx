import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

describe("Home page", () => {
  it("renders an empty page container", () => {
    const { container } = render(<Home />);

    expect(container.firstElementChild).toBeEmptyDOMElement();
  });
});
