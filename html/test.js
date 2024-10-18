function bodyLoaded() {
  Dustel.renderInto(document.getElementById("body"),
                    ["div", {class: "bigfont"}, [
                      ctx=>googleLink(ctx),
                      "Hi there!",
                    ]]
                   )
}

function googleLink(ctx) {
  ctx.initializeState(()=>4*12)
  
  const click = ()=>{
    console.log(`onclick called!`, ctx.state++)
    ctx.update()
  }
  
  return  ["div", [
    "Hello!",
    "Bye!",
    ["a", {href: "http://www.google.com"}, ["Link to google!"]],
    "no",
    ["button", {on: {click}}, [`Click Me!: ${ctx.state}`]],
    ["span", ["yipe"]],
  ]]
}
