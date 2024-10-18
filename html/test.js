function bodyLoaded() {
  Dustel.renderInto(document.getElementById("body"),
                    ["div", {class: "bigfont"}, [
                      ctx=>googleLink(ctx),
                      ctx=>delayed(ctx, 1000, "1000ms!"),
                      ctx=>delayed(ctx, 1500, "1500ms!"),
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

function delayed(ctx, msec, str) {
  if (ctx.initializeState(null)) {
    (async ()=>{
      await new Promise(resolve=>setTimeout(resolve, msec))
      ctx.state = true
      ctx.update()
    })()
  }

  return ["div", [
    ctx.state ? `Waited ${msec} ms for ${str}` : null
  ]]
}
