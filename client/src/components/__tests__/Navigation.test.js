import React from "react";
import { shallow } from "enzyme";

import Navigation from "../Navigation/NavigationContainer";

const wrapper = shallow(<Navigation organization={{}} pathname="/" />);

describe("<Navigation />", () => {
  test("Renders correctly", () => expect(wrapper).toBeDefined());
});
