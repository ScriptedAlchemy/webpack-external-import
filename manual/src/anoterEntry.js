const externalFunction = () => {
  window.wasExternalFunctionCalled = true;
  console.log('some function thats externalized')
};

/*externalize: externalFunction*/

export default externalFunction;
