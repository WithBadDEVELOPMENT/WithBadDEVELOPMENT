(function(){
  var S={},de=document.documentElement,vl=false;
  try{S=JSON.parse(localStorage.getItem('wbd-settings')||'{}')}catch(e){}
  if(!S.ep)return;
  try{vl=!!sessionStorage.getItem('wbd-veil');sessionStorage.removeItem('wbd-veil')}catch(e){}
  var css='position:fixed;top:0;right:0;bottom:0;left:0;background:#fff;z-index:2147483647;pointer-events:none;';

  if(vl){
    var v=document.createElement('div');
    v.style.cssText=css+'opacity:1;transition:opacity .9s ease';
    de.appendChild(v);
    var go=function(){
      requestAnimationFrame(function(){requestAnimationFrame(function(){
        v.style.opacity='0';
        setTimeout(function(){v.remove()},1000);
      })});
    };
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',go);
    else go();
  }

  document.addEventListener('click',function(e){
    if(e.defaultPrevented||e.button||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
    var a=e.target.closest&&e.target.closest('a[href]');
    if(!a||a.target==='_blank'||a.hasAttribute('download'))return;
    var u=new URL(a.href,location.href);
    if(u.origin!==location.origin)return;
    if(u.pathname===location.pathname&&u.search===location.search)return;
    e.preventDefault();
    try{sessionStorage.setItem('wbd-veil','1')}catch(x){}
    var o=document.createElement('div');
    o.id='veil-out';
    o.style.cssText=css+'opacity:0;transition:opacity .75s ease';
    de.appendChild(o);
    void o.offsetWidth;
    o.style.opacity='1';
    setTimeout(function(){location.href=u.href},800);
  });

  window.addEventListener('pageshow',function(e){
    if(e.persisted){
      var x=document.getElementById('veil-out');
      if(x)x.remove();
    }
  });
})();
