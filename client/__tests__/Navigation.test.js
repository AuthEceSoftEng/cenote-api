import React from 'react';
import { shallow } from 'enzyme';

import Navigation from '../src/components/Navigation/NavigationContainer';

const wrapper = shallow(<Navigation user={{}} pathname="/" />);

describe('<Navigation />', () => {
	test('Renders correctly', () => expect(wrapper).toBeDefined());
});
