(self.webpackChunkpd_free_angularcli=self.webpackChunkpd_free_angularcli||[]).push([[735],{92735:function(At){At.exports=function(){"use strict";function w(a){return(w="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(n){return typeof n}:function(n){return n&&"function"==typeof Symbol&&n.constructor===Symbol&&n!==Symbol.prototype?"symbol":typeof n})(a)}function X(a,n){return(X=Object.setPrototypeOf||function(u,c){return u.__proto__=c,u})(a,n)}function yt(){if(typeof Reflect>"u"||!Reflect.construct||Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],function(){})),!0}catch{return!1}}function Q(a,n,o){return(Q=yt()?Reflect.construct:function(c,O,S){var D=[null];D.push.apply(D,O);var V=new(Function.bind.apply(c,D));return S&&X(V,S.prototype),V}).apply(null,arguments)}function L(a){return function gt(a){if(Array.isArray(a))return me(a)}(a)||function St(a){if(typeof Symbol<"u"&&null!=a[Symbol.iterator]||null!=a["@@iterator"])return Array.from(a)}(a)||function bt(a,n){if(a){if("string"==typeof a)return me(a,n);var o=Object.prototype.toString.call(a).slice(8,-1);if("Object"===o&&a.constructor&&(o=a.constructor.name),"Map"===o||"Set"===o)return Array.from(a);if("Arguments"===o||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(o))return me(a,n)}}(a)||function Ot(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function me(a,n){(null==n||n>a.length)&&(n=a.length);for(var o=0,u=new Array(n);o<n;o++)u[o]=a[o];return u}var Rt=Object.hasOwnProperty,He=Object.setPrototypeOf,Lt=Object.isFrozen,Mt=Object.getPrototypeOf,Nt=Object.getOwnPropertyDescriptor,v=Object.freeze,b=Object.seal,Dt=Object.create,ze=typeof Reflect<"u"&&Reflect,ee=ze.apply,_e=ze.construct;ee||(ee=function(n,o,u){return n.apply(o,u)}),v||(v=function(n){return n}),b||(b=function(n){return n}),_e||(_e=function(n,o){return Q(n,L(o))});var Ct=g(Array.prototype.forEach),Ge=g(Array.prototype.pop),Y=g(Array.prototype.push),te=g(String.prototype.toLowerCase),de=g(String.prototype.toString),We=g(String.prototype.match),M=g(String.prototype.replace),wt=g(String.prototype.indexOf),It=g(String.prototype.trim),d=g(RegExp.prototype.test),he=function xt(a){return function(){for(var n=arguments.length,o=new Array(n),u=0;u<n;u++)o[u]=arguments[u];return _e(a,o)}}(TypeError),Be=g(Number.isNaN);function g(a){return function(n){for(var o=arguments.length,u=new Array(o>1?o-1:0),c=1;c<o;c++)u[c-1]=arguments[c];return ee(a,n,u)}}function s(a,n,o){var u;o=null!==(u=o)&&void 0!==u?u:te,He&&He(a,null);for(var c=n.length;c--;){var O=n[c];if("string"==typeof O){var S=o(O);S!==O&&(Lt(n)||(n[c]=S),O=S)}a[O]=!0}return a}function k(a){var o,n=Dt(null);for(o in a)!0===ee(Rt,a,[o])&&(n[o]=a[o]);return n}function re(a,n){for(;null!==a;){var o=Nt(a,n);if(o){if(o.get)return g(o.get);if("function"==typeof o.value)return g(o.value)}a=Mt(a)}return function u(c){return console.warn("fallback value for",c),null}}var $e=v(["a","abbr","acronym","address","area","article","aside","audio","b","bdi","bdo","big","blink","blockquote","body","br","button","canvas","caption","center","cite","code","col","colgroup","content","data","datalist","dd","decorator","del","details","dfn","dialog","dir","div","dl","dt","element","em","fieldset","figcaption","figure","font","footer","form","h1","h2","h3","h4","h5","h6","head","header","hgroup","hr","html","i","img","input","ins","kbd","label","legend","li","main","map","mark","marquee","menu","menuitem","meter","nav","nobr","ol","optgroup","option","output","p","picture","pre","progress","q","rp","rt","ruby","s","samp","section","select","shadow","small","source","spacer","span","strike","strong","style","sub","summary","sup","table","tbody","td","template","textarea","tfoot","th","thead","time","tr","track","tt","u","ul","var","video","wbr"]),Te=v(["svg","a","altglyph","altglyphdef","altglyphitem","animatecolor","animatemotion","animatetransform","circle","clippath","defs","desc","ellipse","filter","font","g","glyph","glyphref","hkern","image","line","lineargradient","marker","mask","metadata","mpath","path","pattern","polygon","polyline","radialgradient","rect","stop","style","switch","symbol","text","textpath","title","tref","tspan","view","vkern"]),ve=v(["feBlend","feColorMatrix","feComponentTransfer","feComposite","feConvolveMatrix","feDiffuseLighting","feDisplacementMap","feDistantLight","feFlood","feFuncA","feFuncB","feFuncG","feFuncR","feGaussianBlur","feImage","feMerge","feMergeNode","feMorphology","feOffset","fePointLight","feSpecularLighting","feSpotLight","feTile","feTurbulence"]),kt=v(["animate","color-profile","cursor","discard","fedropshadow","font-face","font-face-format","font-face-name","font-face-src","font-face-uri","foreignobject","hatch","hatchpath","mesh","meshgradient","meshpatch","meshrow","missing-glyph","script","set","solidcolor","unknown","use"]),Ee=v(["math","menclose","merror","mfenced","mfrac","mglyph","mi","mlabeledtr","mmultiscripts","mn","mo","mover","mpadded","mphantom","mroot","mrow","ms","mspace","msqrt","mstyle","msub","msup","msubsup","mtable","mtd","mtext","mtr","munder","munderover"]),Pt=v(["maction","maligngroup","malignmark","mlongdiv","mscarries","mscarry","msgroup","mstack","msline","msrow","semantics","annotation","annotation-xml","mprescripts","none"]),je=v(["#text"]),Xe=v(["accept","action","align","alt","autocapitalize","autocomplete","autopictureinpicture","autoplay","background","bgcolor","border","capture","cellpadding","cellspacing","checked","cite","class","clear","color","cols","colspan","controls","controlslist","coords","crossorigin","datetime","decoding","default","dir","disabled","disablepictureinpicture","disableremoteplayback","download","draggable","enctype","enterkeyhint","face","for","headers","height","hidden","high","href","hreflang","id","inputmode","integrity","ismap","kind","label","lang","list","loading","loop","low","max","maxlength","media","method","min","minlength","multiple","muted","name","nonce","noshade","novalidate","nowrap","open","optimum","pattern","placeholder","playsinline","poster","preload","pubdate","radiogroup","readonly","rel","required","rev","reversed","role","rows","rowspan","spellcheck","scope","selected","shape","size","sizes","span","srclang","start","src","srcset","step","style","summary","tabindex","title","translate","type","usemap","valign","value","width","xmlns","slot"]),Ae=v(["accent-height","accumulate","additive","alignment-baseline","ascent","attributename","attributetype","azimuth","basefrequency","baseline-shift","begin","bias","by","class","clip","clippathunits","clip-path","clip-rule","color","color-interpolation","color-interpolation-filters","color-profile","color-rendering","cx","cy","d","dx","dy","diffuseconstant","direction","display","divisor","dur","edgemode","elevation","end","fill","fill-opacity","fill-rule","filter","filterunits","flood-color","flood-opacity","font-family","font-size","font-size-adjust","font-stretch","font-style","font-variant","font-weight","fx","fy","g1","g2","glyph-name","glyphref","gradientunits","gradienttransform","height","href","id","image-rendering","in","in2","k","k1","k2","k3","k4","kerning","keypoints","keysplines","keytimes","lang","lengthadjust","letter-spacing","kernelmatrix","kernelunitlength","lighting-color","local","marker-end","marker-mid","marker-start","markerheight","markerunits","markerwidth","maskcontentunits","maskunits","max","mask","media","method","mode","min","name","numoctaves","offset","operator","opacity","order","orient","orientation","origin","overflow","paint-order","path","pathlength","patterncontentunits","patterntransform","patternunits","points","preservealpha","preserveaspectratio","primitiveunits","r","rx","ry","radius","refx","refy","repeatcount","repeatdur","restart","result","rotate","scale","seed","shape-rendering","specularconstant","specularexponent","spreadmethod","startoffset","stddeviation","stitchtiles","stop-color","stop-opacity","stroke-dasharray","stroke-dashoffset","stroke-linecap","stroke-linejoin","stroke-miterlimit","stroke-opacity","stroke","stroke-width","style","surfacescale","systemlanguage","tabindex","targetx","targety","transform","transform-origin","text-anchor","text-decoration","text-rendering","textlength","type","u1","u2","unicode","values","viewbox","visibility","version","vert-adv-y","vert-origin-x","vert-origin-y","width","word-spacing","wrap","writing-mode","xchannelselector","ychannelselector","x","x1","x2","xmlns","y","y1","y2","z","zoomandpan"]),Ye=v(["accent","accentunder","align","bevelled","close","columnsalign","columnlines","columnspan","denomalign","depth","dir","display","displaystyle","encoding","fence","frame","height","href","id","largeop","length","linethickness","lspace","lquote","mathbackground","mathcolor","mathsize","mathvariant","maxsize","minsize","movablelimits","notation","numalign","open","rowalign","rowlines","rowspacing","rowspan","rspace","rquote","scriptlevel","scriptminsize","scriptsizemultiplier","selection","separator","separators","stretchy","subscriptshift","supscriptshift","symmetric","voffset","width","xmlns"]),ae=v(["xlink:href","xml:id","xlink:title","xml:space","xmlns:xlink"]),Ft=b(/\{\{[\w\W]*|[\w\W]*\}\}/gm),Ut=b(/<%[\w\W]*|[\w\W]*%>/gm),Ht=b(/\${[\w\W]*}/gm),zt=b(/^data-[\-\w.\u00B7-\uFFFF]/),Gt=b(/^aria-[\-\w]+$/),Wt=b(/^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i),Bt=b(/^(?:\w+script|data):/i),$t=b(/[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g),jt=b(/^html$/i),Xt=b(/^[a-z][.\w]*(-[.\w]+)+$/i),Yt=function(){return typeof window>"u"?null:window},Vt=function(n,o){if("object"!==w(n)||"function"!=typeof n.createPolicy)return null;var u=null,c="data-tt-policy-suffix";o.currentScript&&o.currentScript.hasAttribute(c)&&(u=o.currentScript.getAttribute(c));var O="dompurify"+(u?"#"+u:"");try{return n.createPolicy(O,{createHTML:function(D){return D},createScriptURL:function(D){return D}})}catch{return console.warn("TrustedTypes policy "+O+" could not be created."),null}};return function Ve(){var a=arguments.length>0&&void 0!==arguments[0]?arguments[0]:Yt(),n=function(e){return Ve(e)};if(n.version="2.5.3",n.removed=[],!a||!a.document||9!==a.document.nodeType)return n.isSupported=!1,n;var o=a.document,u=a.document,c=a.DocumentFragment,O=a.HTMLTemplateElement,S=a.Node,D=a.Element,P=a.NodeFilter,V=a.NamedNodeMap,Kt=void 0===V?a.NamedNodeMap||a.MozNamedAttrMap:V,Zt=a.HTMLFormElement,Jt=a.DOMParser,ne=a.trustedTypes,ie=D.prototype,Qt=re(ie,"cloneNode"),er=re(ie,"nextSibling"),tr=re(ie,"childNodes"),q=re(ie,"parentNode");if("function"==typeof O){var ye=u.createElement("template");ye.content&&ye.content.ownerDocument&&(u=ye.content.ownerDocument)}var N=Vt(ne,o),ge=N?N.createHTML(""):"",Se=u.implementation,rr=u.createNodeIterator,ar=u.createDocumentFragment,nr=u.getElementsByTagName,ir=o.importNode,qe={};try{qe=k(u).documentMode?u.documentMode:{}}catch{}var C={};n.isSupported="function"==typeof q&&Se&&void 0!==Se.createHTMLDocument&&9!==qe;var U,_,be=Ft,Oe=Ut,Re=Ht,or=zt,lr=Gt,sr=Bt,Ke=$t,ur=Xt,Le=Wt,p=null,Ze=s({},[].concat(L($e),L(Te),L(ve),L(Ee),L(je))),m=null,Je=s({},[].concat(L(Xe),L(Ae),L(Ye),L(ae))),f=Object.seal(Object.create(null,{tagNameCheck:{writable:!0,configurable:!1,enumerable:!0,value:null},attributeNameCheck:{writable:!0,configurable:!1,enumerable:!0,value:null},allowCustomizedBuiltInElements:{writable:!0,configurable:!1,enumerable:!0,value:!1}})),K=null,Me=null,Qe=!0,Ne=!0,et=!1,tt=!0,z=!1,De=!0,F=!1,Ce=!1,we=!1,G=!1,le=!1,se=!1,rt=!0,at=!1,fr="user-content-",Ie=!0,Z=!1,W={},B=null,nt=s({},["annotation-xml","audio","colgroup","desc","foreignobject","head","iframe","math","mi","mn","mo","ms","mtext","noembed","noframes","noscript","plaintext","script","style","svg","template","thead","title","video","xmp"]),it=null,ot=s({},["audio","video","img","source","image","track"]),xe=null,lt=s({},["alt","class","for","id","label","name","pattern","placeholder","role","summary","title","value","style","xmlns"]),ue="http://www.w3.org/1998/Math/MathML",fe="http://www.w3.org/2000/svg",I="http://www.w3.org/1999/xhtml",$=I,ke=!1,Pe=null,cr=s({},[ue,fe,I],de),pr=["application/xhtml+xml","text/html"],mr="text/html",j=null,st=255,_r=u.createElement("form"),ut=function(e){return e instanceof RegExp||e instanceof Function},Fe=function(e){j&&j===e||((!e||"object"!==w(e))&&(e={}),e=k(e),U=U=-1===pr.indexOf(e.PARSER_MEDIA_TYPE)?mr:e.PARSER_MEDIA_TYPE,_="application/xhtml+xml"===U?de:te,p="ALLOWED_TAGS"in e?s({},e.ALLOWED_TAGS,_):Ze,m="ALLOWED_ATTR"in e?s({},e.ALLOWED_ATTR,_):Je,Pe="ALLOWED_NAMESPACES"in e?s({},e.ALLOWED_NAMESPACES,de):cr,xe="ADD_URI_SAFE_ATTR"in e?s(k(lt),e.ADD_URI_SAFE_ATTR,_):lt,it="ADD_DATA_URI_TAGS"in e?s(k(ot),e.ADD_DATA_URI_TAGS,_):ot,B="FORBID_CONTENTS"in e?s({},e.FORBID_CONTENTS,_):nt,K="FORBID_TAGS"in e?s({},e.FORBID_TAGS,_):{},Me="FORBID_ATTR"in e?s({},e.FORBID_ATTR,_):{},W="USE_PROFILES"in e&&e.USE_PROFILES,Qe=!1!==e.ALLOW_ARIA_ATTR,Ne=!1!==e.ALLOW_DATA_ATTR,et=e.ALLOW_UNKNOWN_PROTOCOLS||!1,tt=!1!==e.ALLOW_SELF_CLOSE_IN_ATTR,z=e.SAFE_FOR_TEMPLATES||!1,De=!1!==e.SAFE_FOR_XML,F=e.WHOLE_DOCUMENT||!1,G=e.RETURN_DOM||!1,le=e.RETURN_DOM_FRAGMENT||!1,se=e.RETURN_TRUSTED_TYPE||!1,we=e.FORCE_BODY||!1,rt=!1!==e.SANITIZE_DOM,at=e.SANITIZE_NAMED_PROPS||!1,Ie=!1!==e.KEEP_CONTENT,Z=e.IN_PLACE||!1,Le=e.ALLOWED_URI_REGEXP||Le,$=e.NAMESPACE||I,f=e.CUSTOM_ELEMENT_HANDLING||{},e.CUSTOM_ELEMENT_HANDLING&&ut(e.CUSTOM_ELEMENT_HANDLING.tagNameCheck)&&(f.tagNameCheck=e.CUSTOM_ELEMENT_HANDLING.tagNameCheck),e.CUSTOM_ELEMENT_HANDLING&&ut(e.CUSTOM_ELEMENT_HANDLING.attributeNameCheck)&&(f.attributeNameCheck=e.CUSTOM_ELEMENT_HANDLING.attributeNameCheck),e.CUSTOM_ELEMENT_HANDLING&&"boolean"==typeof e.CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements&&(f.allowCustomizedBuiltInElements=e.CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements),z&&(Ne=!1),le&&(G=!0),W&&(p=s({},L(je)),m=[],!0===W.html&&(s(p,$e),s(m,Xe)),!0===W.svg&&(s(p,Te),s(m,Ae),s(m,ae)),!0===W.svgFilters&&(s(p,ve),s(m,Ae),s(m,ae)),!0===W.mathMl&&(s(p,Ee),s(m,Ye),s(m,ae))),e.ADD_TAGS&&(p===Ze&&(p=k(p)),s(p,e.ADD_TAGS,_)),e.ADD_ATTR&&(m===Je&&(m=k(m)),s(m,e.ADD_ATTR,_)),e.ADD_URI_SAFE_ATTR&&s(xe,e.ADD_URI_SAFE_ATTR,_),e.FORBID_CONTENTS&&(B===nt&&(B=k(B)),s(B,e.FORBID_CONTENTS,_)),Ie&&(p["#text"]=!0),F&&s(p,["html","head","body"]),p.table&&(s(p,["tbody"]),delete K.tbody),v&&v(e),j=e)},ft=s({},["mi","mo","mn","ms","mtext"]),ct=s({},["foreignobject","annotation-xml"]),dr=s({},["title","style","font","a","script"]),ce=s({},Te);s(ce,ve),s(ce,kt);var Ue=s({},Ee);s(Ue,Pt);var hr=function(e){var t=q(e);(!t||!t.tagName)&&(t={namespaceURI:$,tagName:"template"});var r=te(e.tagName),l=te(t.tagName);return!!Pe[e.namespaceURI]&&(e.namespaceURI===fe?t.namespaceURI===I?"svg"===r:t.namespaceURI===ue?"svg"===r&&("annotation-xml"===l||ft[l]):Boolean(ce[r]):e.namespaceURI===ue?t.namespaceURI===I?"math"===r:t.namespaceURI===fe?"math"===r&&ct[l]:Boolean(Ue[r]):e.namespaceURI===I?!(t.namespaceURI===fe&&!ct[l]||t.namespaceURI===ue&&!ft[l])&&!Ue[r]&&(dr[r]||!ce[r]):!("application/xhtml+xml"!==U||!Pe[e.namespaceURI]))},E=function(e){Y(n.removed,{element:e});try{e.parentNode.removeChild(e)}catch{try{e.outerHTML=ge}catch{e.remove()}}},pe=function(e,t){try{Y(n.removed,{attribute:t.getAttributeNode(e),from:t})}catch{Y(n.removed,{attribute:null,from:t})}if(t.removeAttribute(e),"is"===e&&!m[e])if(G||le)try{E(t)}catch{}else try{t.setAttribute(e,"")}catch{}},pt=function(e){var t,r;if(we)e="<remove></remove>"+e;else{var l=We(e,/^[\r\n\t ]+/);r=l&&l[0]}"application/xhtml+xml"===U&&$===I&&(e='<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>'+e+"</body></html>");var A=N?N.createHTML(e):e;if($===I)try{t=(new Jt).parseFromString(A,U)}catch{}if(!t||!t.documentElement){t=Se.createDocument($,"template",null);try{t.documentElement.innerHTML=ke?ge:A}catch{}}var T=t.body||t.documentElement;return e&&r&&T.insertBefore(u.createTextNode(r),T.childNodes[0]||null),$===I?nr.call(t,F?"html":"body")[0]:F?t.documentElement:T},mt=function(e){return rr.call(e.ownerDocument||e,e,P.SHOW_ELEMENT|P.SHOW_COMMENT|P.SHOW_TEXT|P.SHOW_PROCESSING_INSTRUCTION|P.SHOW_CDATA_SECTION,null,!1)},_t=function(e){return e instanceof Zt&&(typeof e.__depth<"u"&&"number"!=typeof e.__depth||typeof e.__removalCount<"u"&&"number"!=typeof e.__removalCount||"string"!=typeof e.nodeName||"string"!=typeof e.textContent||"function"!=typeof e.removeChild||!(e.attributes instanceof Kt)||"function"!=typeof e.removeAttribute||"function"!=typeof e.setAttribute||"string"!=typeof e.namespaceURI||"function"!=typeof e.insertBefore||"function"!=typeof e.hasChildNodes)},J=function(e){return"object"===w(S)?e instanceof S:e&&"object"===w(e)&&"number"==typeof e.nodeType&&"string"==typeof e.nodeName},x=function(e,t,r){!C[e]||Ct(C[e],function(l){l.call(n,t,r,j)})},dt=function(e){var t;if(x("beforeSanitizeElements",e,null),_t(e)||d(/[\u0080-\uFFFF]/,e.nodeName))return E(e),!0;var r=_(e.nodeName);if(x("uponSanitizeElement",e,{tagName:r,allowedTags:p}),e.hasChildNodes()&&!J(e.firstElementChild)&&(!J(e.content)||!J(e.content.firstElementChild))&&d(/<[/\w]/g,e.innerHTML)&&d(/<[/\w]/g,e.textContent)||"select"===r&&d(/<template/i,e.innerHTML)||7===e.nodeType||De&&8===e.nodeType&&d(/<[/\w]/g,e.data))return E(e),!0;if(!p[r]||K[r]){if(!K[r]&&Tt(r)&&(f.tagNameCheck instanceof RegExp&&d(f.tagNameCheck,r)||f.tagNameCheck instanceof Function&&f.tagNameCheck(r)))return!1;if(Ie&&!B[r]){var l=q(e)||e.parentNode,A=tr(e)||e.childNodes;if(A&&l)for(var h=A.length-1;h>=0;--h){var H=Qt(A[h],!0);H.__removalCount=(e.__removalCount||0)+1,l.insertBefore(H,er(e))}}return E(e),!0}return e instanceof D&&!hr(e)||("noscript"===r||"noembed"===r||"noframes"===r)&&d(/<\/no(script|embed|frames)/i,e.innerHTML)?(E(e),!0):(z&&3===e.nodeType&&(t=M(t=e.textContent,be," "),t=M(t,Oe," "),t=M(t,Re," "),e.textContent!==t&&(Y(n.removed,{element:e.cloneNode()}),e.textContent=t)),x("afterSanitizeElements",e,null),!1)},ht=function(e,t,r){if(rt&&("id"===t||"name"===t)&&(r in u||r in _r||"__depth"===r||"__removalCount"===r))return!1;if((!Ne||Me[t]||!d(or,t))&&(!Qe||!d(lr,t)))if(!m[t]||Me[t]){if(!(Tt(e)&&(f.tagNameCheck instanceof RegExp&&d(f.tagNameCheck,e)||f.tagNameCheck instanceof Function&&f.tagNameCheck(e))&&(f.attributeNameCheck instanceof RegExp&&d(f.attributeNameCheck,t)||f.attributeNameCheck instanceof Function&&f.attributeNameCheck(t))||"is"===t&&f.allowCustomizedBuiltInElements&&(f.tagNameCheck instanceof RegExp&&d(f.tagNameCheck,r)||f.tagNameCheck instanceof Function&&f.tagNameCheck(r))))return!1}else if(!xe[t]&&!d(Le,M(r,Ke,""))&&("src"!==t&&"xlink:href"!==t&&"href"!==t||"script"===e||0!==wt(r,"data:")||!it[e])&&(!et||d(sr,M(r,Ke,"")))&&r)return!1;return!0},Tt=function(e){return"annotation-xml"!==e&&We(e,ur)},vt=function(e){var t,r,l,A;x("beforeSanitizeAttributes",e,null);var T=e.attributes;if(T){var h={attrName:"",attrValue:"",keepAttr:!0,allowedAttributes:m};for(A=T.length;A--;){var R=(t=T[A]).name,y=t.namespaceURI;if(r="value"===R?t.value:It(t.value),l=_(R),h.attrName=l,h.attrValue=r,h.keepAttr=!0,h.forceKeepAttr=void 0,x("uponSanitizeAttribute",e,h),r=h.attrValue,!h.forceKeepAttr&&(pe(R,e),h.keepAttr)){if(!tt&&d(/\/>/i,r)){pe(R,e);continue}if(De&&d(/((--!?|])>)|<\/(style|title)/i,r)){pe(R,e);continue}z&&(r=M(r,be," "),r=M(r,Oe," "),r=M(r,Re," "));var Et=_(e.nodeName);if(ht(Et,l,r)){if(at&&("id"===l||"name"===l)&&(pe(R,e),r=fr+r),N&&"object"===w(ne)&&"function"==typeof ne.getAttributeType&&!y)switch(ne.getAttributeType(Et,l)){case"TrustedHTML":r=N.createHTML(r);break;case"TrustedScriptURL":r=N.createScriptURL(r)}try{y?e.setAttributeNS(y,R,r):e.setAttribute(R,r),_t(e)?E(e):Ge(n.removed)}catch{}}}}x("afterSanitizeAttributes",e,null)}},Tr=function i(e){var t,r=mt(e);for(x("beforeSanitizeShadowDOM",e,null);t=r.nextNode();)if(x("uponSanitizeShadowNode",t,null),!dt(t)){var l=q(t);1===t.nodeType&&(t.__depth=l&&l.__depth?(t.__removalCount||0)+l.__depth+1:1),(t.__depth>=st||Be(t.__depth))&&E(t),t.content instanceof c&&(t.content.__depth=t.__depth,i(t.content)),vt(t)}x("afterSanitizeShadowDOM",e,null)};return n.sanitize=function(i){var t,r,l,A,T,e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};if((ke=!i)&&(i="\x3c!--\x3e"),"string"!=typeof i&&!J(i)){if("function"!=typeof i.toString)throw he("toString is not a function");if("string"!=typeof(i=i.toString()))throw he("dirty is not a string, aborting")}if(!n.isSupported){if("object"===w(a.toStaticHTML)||"function"==typeof a.toStaticHTML){if("string"==typeof i)return a.toStaticHTML(i);if(J(i))return a.toStaticHTML(i.outerHTML)}return i}if(Ce||Fe(e),n.removed=[],"string"==typeof i&&(Z=!1),Z){if(i.nodeName){var h=_(i.nodeName);if(!p[h]||K[h])throw he("root node is forbidden and cannot be sanitized in-place")}}else if(i instanceof S)1===(r=(t=pt("\x3c!----\x3e")).ownerDocument.importNode(i,!0)).nodeType&&"BODY"===r.nodeName||"HTML"===r.nodeName?t=r:t.appendChild(r);else{if(!G&&!z&&!F&&-1===i.indexOf("<"))return N&&se?N.createHTML(i):i;if(!(t=pt(i)))return G?null:se?ge:""}t&&we&&E(t.firstChild);for(var H=mt(Z?i:t);l=H.nextNode();)if((3!==l.nodeType||l!==A)&&!dt(l)){var R=q(l);1===l.nodeType&&(l.__depth=R&&R.__depth?(l.__removalCount||0)+R.__depth+1:1),(l.__depth>=st||Be(l.__depth))&&E(l),l.content instanceof c&&(l.content.__depth=l.__depth,Tr(l.content)),vt(l),A=l}if(A=null,Z)return i;if(G){if(le)for(T=ar.call(t.ownerDocument);t.firstChild;)T.appendChild(t.firstChild);else T=t;return(m.shadowroot||m.shadowrootmod)&&(T=ir.call(o,T,!0)),T}var y=F?t.outerHTML:t.innerHTML;return F&&p["!doctype"]&&t.ownerDocument&&t.ownerDocument.doctype&&t.ownerDocument.doctype.name&&d(jt,t.ownerDocument.doctype.name)&&(y="<!DOCTYPE "+t.ownerDocument.doctype.name+">\n"+y),z&&(y=M(y,be," "),y=M(y,Oe," "),y=M(y,Re," ")),N&&se?N.createHTML(y):y},n.setConfig=function(i){Fe(i),Ce=!0},n.clearConfig=function(){j=null,Ce=!1},n.isValidAttribute=function(i,e,t){j||Fe({});var r=_(i),l=_(e);return ht(r,l,t)},n.addHook=function(i,e){"function"==typeof e&&(C[i]=C[i]||[],Y(C[i],e))},n.removeHook=function(i){if(C[i])return Ge(C[i])},n.removeHooks=function(i){C[i]&&(C[i]=[])},n.removeAllHooks=function(){C={}},n}()}()}}]);