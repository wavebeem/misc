/** @jsx h */

const JSX = Symbol("JSX");

function h(...args: any) {
  return [JSX, ...args];
}

function Foo(props: any) {
  return props.children
}

console.log(<Foo x="cool">Nice</Foo>);
console.log(<Foo />);
console.log(<div id="nice" />);
console.log(<div />);
