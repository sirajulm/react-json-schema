import { createElement } from 'react';
import DOM from 'react-dom-factories';
import DOMServer from "react-dom/server";

const _componentMap = new WeakMap();

export default class ReactJsonSchema {

  parseSchema(schema, toStaticMarkup) {
    let element = null;
    let elements = null;

    if(toStaticMarkup) {
      schema.toStaticMarkup = toStaticMarkup;
    }
    if (Array.isArray(schema)) {
      elements = this.parseSubSchemas(schema, toStaticMarkup);
    } else if (schema) {
      element = this.createComponent(schema, toStaticMarkup);
    }
    return element || elements;
  }

  parseSubSchemas(subSchemas = [], toStaticMarkup) {
    const Components = [];
    let index = 0;
    for (const subSchema of subSchemas) {
      subSchema.key = typeof subSchema.key !== 'undefined' ? subSchema.key : index;
      Components.push(this.parseSchema(subSchema, toStaticMarkup));
      index++;
    }
    return Components;
  }

  createComponent(schema, toStaticMarkup) {
    const { component, children, text, ...rest } = schema;
    const Component = this.resolveComponent(schema);
    const Children = typeof text !== 'undefined' ? text : this.resolveComponentChildren(schema, toStaticMarkup);
    return createElement(Component, rest, Children);
  }

  resolveComponent(schema) {
    const componentMap = this.getComponentMap();
    let Component = null;
    if (schema.hasOwnProperty('component')) {
      if (schema.component === Object(schema.component)) {
        Component = schema.component;
      } else if (componentMap && componentMap[schema.component]) {
        Component = componentMap[schema.component];
      } else if (DOM.hasOwnProperty(schema.component)) {
        Component = schema.component;
      }
    } else {
      throw new Error('ReactJsonSchema could not resolve a component due to a missing component attribute in the schema.');
    }
    return Component;
  }

  resolveComponentChildren(schema, toStaticMarkup) {
    return (schema.hasOwnProperty('children')) ?
      this.parseSchema(schema.children, toStaticMarkup) : undefined;
  }

  getComponentMap() {
    return _componentMap.get(this);
  }

  setComponentMap(componentMap) {
    _componentMap.set(this, componentMap);
  }
  getStaticMarkup(schema) {
    schema.toStaticMarkup = true;
    return DOMServer.renderToStaticMarkup(this.parseSchema(schema, schema.toStaticMarkup))
  }
}
