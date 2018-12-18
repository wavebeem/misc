import * as React from "react";
import {
  render,
  Window,
  App,
  Button,
  Box,
  Text,
  TextInput,
  Tab,
  Form,
  Checkbox
} from "proton-native";

class Example extends React.Component {
  render() {
    return (
      <App>
        <Window
          title="cool nice app"
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
            <Form padded>
              <TextInput label="name" />
              <TextInput label="username" />
              <TextInput secure label="password" />
              <TextInput multiline label="bio" />
            </Form>
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
