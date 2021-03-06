ES6Promise.polyfill()


// create a reusable audio context
window.AudioContext = window.AudioContext || window.webkitAudioContext
window.context = parent.context || new AudioContext()


// iOS hack (untested)
;(function(element, context, event){
  element.addEventListener(event, handler)
  function handler(){
    context.resume()
    setTimeout(function () {
      if (context.state === 'running') {
        element.removeEventListener(event, handler, false)
      }
    }, 0)
  }
})(document.body, window.context, 'touchend')


var htm = document.getElementsByTagName('html')[0]
toggle.onclick = function(e){
  e.preventDefault()
  htm.classList.toggle('fill')
}

var code = CodeMirror(document.getElementById('code'), {
  value: "",
  mode:  "javascript",
  lineWrapping: true,
  // readOnly: true
})

var textarea = document.querySelector('textarea')
var iframe   = document.querySelector('iframe')
var error_el = document.getElementById('error')

var template = fetch('template.txt')
                 .then(function(r){return r.text()})
                 .then(function(text){
                   var parts = text.split('{{INJECT}}')
                   return function(code){
                     return new Blob([
                       parts[0],
                       code,
                       parts[1]
                     ],{type: 'text/html'})
                   }
                 })

function load(){
  convert(window.files)
    .then(function(code){
      template
        .then(function(template) {

          URL.revokeObjectURL(iframe.src)

          var blob = template(code)

          var url = URL.createObjectURL(blob)
          iframe.src = url
        })
    })
  .then(function(ok){
    error_el.style.display = 'none'
  }, function(err){
    error_el.style.display = 'block'
    error_el.innerText = err
  })

}

load()
code.on('change', debounce(load, 200))

function debounce(fn, millis, timer){
  return function(){
    clearTimeout(timer)
    timer = setTimeout(fn,millis,arguments)
  }
}


//hook up orientation events
window.addEventListener('deviceorientation', (e) => {
  iframe.contentWindow.postMessage({
    eventName:'deviceorientation',
    value: {
      alpha: e.alpha,
      beta: e.beta,
      gamma: e.gamma
    }
  }, '*')
}, false)
