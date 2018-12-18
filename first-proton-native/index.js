import React, { Component } from "react";
import {
  render,
  Window,
  App,
  Button,
  Box,
  Text,
  TextInput,
  Tab,
  Checkbox
} from "proton-native";

class Example extends Component {
  render() {
    return (
      <App>
        <Window
          title="Proton Native Rocks!"
          margined
          size={{ w: 300, h: 300 }}
          menuBar={false}
        >
          <Box>
            <Box padded vertical={false}>
              <Button stretchy={false}>Click me</Button>
              <Button stretchy={false}>And me</Button>
            </Box>
            <Box>
              <Text>HELLO</Text>
              <TextInput />
              <Checkbox>Whatup</Checkbox>
            </Box>
            <Tab>
              <Box label="First"><Text>First</Text></Box>
              <Box label="Second"><Text>Second</Text></Box>
              <Box label="Third"><Text>Third</Text></Box>
            </Tab>
          </Box>
        </Window>
      </App>
    );
  }
}

render(<Example />);
