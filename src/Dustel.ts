export type NodeSrc = NonFunctionNodeSrc | RenderingFunc<any>

export type NonFunctionNodeSrc =
  | null
  | undefined
  | boolean
  | string
  | number
  | symbol
  | NodeSrcElem

export type NodeSrcElem =
  | [string]
  | [string, NodeSrcAttrs]
  | [string, NodeSrcChildren]
  | [string, NodeSrcAttrs, NodeSrcChildren]

export type NodeSrcAttrs = {
  on?: NodeEventListeners
} & {[name: string]: string | null}

export type NodeEventListeners = {[name: string]: NodeEventListener}

// FIXME - more accurate description
export type NodeEventListener = () => void

export type NodeSrcChildren = Array<NodeSrc>

class Rendering {
  root!: RenderedNode<any>

  nodesToUpdate: Array<RenderedNode<any>> | null = null

  constructor() {}

  addNodeToUpdate(node: RenderedNode<any>) {
    if (this.nodesToUpdate == null) {
      this.nodesToUpdate = [node]
      window.requestAnimationFrame(() => this.updateNodes())
    } else {
      this.nodesToUpdate.push(node)
    }
  }

  updateNodes() {
    const nodesToUpdate = this.nodesToUpdate
    if (nodesToUpdate != null) {
      this.nodesToUpdate = null
      for (const node of nodesToUpdate) {
        node.renderRequested = false
        node.runRenderFunction()
      }
    }
  }
}

export function renderInto(node: Node, nodeSrc: NodeSrc): Rendering {
  const rendering = new Rendering()
  const root = new RenderedNode(rendering, node)
  rendering.root = root
  renderNode(rendering, root, nodeSrc)
  return rendering
}

export type RenderingFunc<S> = (
  context: RenderingContext<S>
) => NonFunctionNodeSrc

export interface RenderingContext<S> {
  state: S
  initializeState(state: S | (() => S)): boolean
  update(): void
}

class RenderedNode<S> implements RenderingContext<S> {
  // The node among its siblings
  prev: RenderedNode<any> | null = null
  next: RenderedNode<any> | null = null

  // The child nodes
  head: RenderedNode<any> | null = null
  tail: RenderedNode<any> | null = null

  node: Node | null = null
  func: RenderingFunc<S> | null = null

  _state!: S
  _stateInitialized = false

  renderRequested = false

  constructor(
    public rendering: Rendering,
    public parent: Node
  ) {}

  setNode(node: Node | null) {
    if (this.node != null) {
      this.clear()
    }
    this.node = node

    if (node != null) {
      const nextNode = this.getNextNode()
      if (nextNode != null) {
        this.parent.insertBefore(node, nextNode)
      } else {
        this.parent.appendChild(node)
      }
    }
  }

  get state() {
    if (!this._stateInitialized) {
      throw new Error(`initializeState or state= has not yet been called`)
    } else {
      return this._state
    }
  }

  set state(state: S) {
    this._state = state
    this._stateInitialized = true
  }

  initializeState(state: S | (() => S)): boolean {
    if (!this._stateInitialized) {
      if (typeof state === "function") {
        const sfunc: Function = state
        this.state = sfunc()
      } else {
        this.state = state
      }
      return true
    } else {
      return false
    }
  }

  getNextNode(): Node | null {
    for (let n = this.next; n != null; n = n.next) {
      if (n.node != null) {
        return n.node
      }
    }
    return null
  }

  setFunc(func: RenderingFunc<S> | null) {
    // FIXME - implement this
    this.func = func
  }

  appendChild(renderedNode: RenderedNode<any>) {
    renderedNode.prev = this.tail
    renderedNode.next = null
    if (this.tail != null) {
      this.tail.next = renderedNode
    }
    this.tail = renderedNode
    if (this.head == null) {
      this.head = renderedNode
    }
  }

  runRenderFunction() {
    const func = this.func
    if (func != null) {
      this.clear()
      const newNodeSrc = func(this)
      renderNode(this.rendering, this, newNodeSrc)
    }
  }

  clear() {
    this.notifyDescendantsOfUnload()
    if (this.node != null) {
      if (this.node.parentNode != null) {
        this.node.parentNode.removeChild(this.node)
      }
      this.node = null
    }
    this.head = null
    this.tail = null
  }

  notifyOfUnload() {
    // FIXME - implmement this
    this.notifyDescendantsOfUnload()
  }

  notifyDescendantsOfUnload() {
    // FIXME - do an optimization to only do this if we know that at least one descendant cares
    for (let child = this.head; child != null; child = child.next) {
      child.notifyOfUnload()
    }
  }

  notifyOfLoad() {
    // FIXME - implmement this
    this.notifyDescendantsOfLoad()
  }

  notifyDescendantsOfLoad() {
    // FIXME - do an optimization to only do this if we know that at least one descendant cares
    for (let child = this.head; child != null; child = child.next) {
      child.notifyOfLoad()
    }
  }

  update() {
    if (!this.renderRequested) {
      this.renderRequested = true
      this.rendering.addNodeToUpdate(this)
    }
  }
}

function renderNode(
  rendering: Rendering,
  renderedNode: RenderedNode<any>,
  nodeSrc: NodeSrc
) {
  switch (typeof nodeSrc) {
    case "undefined":
      renderedNode.setNode(null)
      break
    case "boolean":
    case "string":
    case "number":
      renderedNode.setNode(document.createTextNode(nodeSrc.toString()))
      break
    case "symbol": {
      const desc = nodeSrc.description
      renderedNode.setNode(desc == null ? null : document.createTextNode(desc))
      break
    }
    case "object":
      if (nodeSrc == null) {
        renderedNode.setNode(null)
      } else if (Array.isArray(nodeSrc)) {
        const {name, attrs, children} = parseNodeSrcElem(nodeSrc)
        const node = document.createElement(name)
        if (attrs != null) {
          for (const attrName of Object.keys(attrs)) {
            if (attrName === "on") {
              if (attrs.on != null) {
                const eventListeners = attrs.on
                for (const eventName of Object.keys(eventListeners)) {
                  const listener = eventListeners[eventName]
                  node.addEventListener(eventName, listener)
                }
              }
            } else {
              // FIXME - handle style specially
              // FIXME - be flexible about value types - combine arrays, etc.
              const attrValue = attrs[attrName]
              if (attrValue != null) {
                node.setAttribute(attrName, attrValue)
              }
            }
          }
        }
        if (children != null) {
          for (const childSrc of children) {
            const childRenderedNode = new RenderedNode(rendering, node)
            renderedNode.appendChild(childRenderedNode)
            renderNode(rendering, childRenderedNode, childSrc)
          }
        }
        renderedNode.setNode(node)
      } else {
        throw new Error(`Unrecognized object value type`)
      }
      break
    case "function":
      renderedNode.setFunc(nodeSrc)
      renderedNode.runRenderFunction()
      break
    default:
      throw new Error(`Unrecognized value type "${typeof nodeSrc}"`)
  }
}

function parseNodeSrcElem(nodeSrc: NodeSrcElem): ElemSrc {
  const [name, s1, s2] = nodeSrc
  const attrs = s1 != null && !Array.isArray(s1) ? s1 : null
  const children =
    s1 != null && Array.isArray(s1)
      ? s1
      : s2 != null && Array.isArray(s2)
        ? s2
        : null
  return {name, attrs, children}
}

interface ElemSrc {
  name: string
  attrs: NodeSrcAttrs | null
  children: NodeSrcChildren | null
}
