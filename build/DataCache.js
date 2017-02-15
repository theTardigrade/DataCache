!(function(){var e="object",t="function",r="string",n="number",o="undefined";!(function(a,i,f,u,s){"use strict";function c(t){var i=(function(){var e=t?t.size:NaN,r=e===n||isNaN(e)?e:parseInt(e,10);return r*=2,r=u.min(r,h),u.max(r,0)})(),c=this._debugCache=[],p=r,w=(function(){var e="The only allowable key types are ";return y.forEach((function(t,r,n){var o='"'+t+'"';e+=r<n.length-2?o+", ":r<n.length-1?o:" and "+o+"."})),function(t){var r=y.some((function(e){return t===e}));if(!r)throw a.TypeError(e);p=t.toLowerCase()}})();t&&typeof t.keyType===r&&w(t.keyType),this.get=function(e,t){d(e,p);var r=l(c,e);return r===-1?void 0:t&&t.dataOnly?c[r].data:c[r]},this.has=function(e){return d(e,p),l(c,e)>-1},this.set=function(t,r){p||w(typeof t),d(t,p);var n=l(c,t);if(n===-1&&(n=c.length+1),n>=i)throw new a.Error("Maximum number of elements reached.");typeof r===e&&v.freeze&&s.freeze(r);var o={data:r,updated:v.now?f.now():(new f).getTime()};return o.created=c[n]&&c[n].created?c[n].created:o.updated,c[n-1]=t,c[n]=o,g(c),o},this.unset=function(e){var t=l(c,e),r=c.length;if(t===-1)return!1;if(r>2)for(var n,o=1;o>=0;--o)n=c[t-o],c[t-o]=c[r-o-1],c[r-o-1]=n;for(var a=0;a<2;++a)c.pop();return!g(c)},this.iterate=function(e,t){for(var r=t&&t.dataOnly,n=1,a=c.length;n<a;n+=2)typeof c[n]!==o&&e(r?c[n].data:c[n])},this.clear=function(){return!!(c=[])}}var p=typeof i===e&&typeof i.exports===e&&typeof process===e&&typeof process.versions==e&&!isNaN(parseFloat(process.versions.node,10)),y=[r,n],h=4294967295,v=(function(e){for(var r={},n=0,o=e.length;n<o;++n){var a=e[n];r[a.key]=typeof a.object[a.key]===t}return r})([{key:"assign",object:s},{key:"freeze",object:s},{key:"now",object:f}]),d=function(e,t){if(typeof e!==t)throw new a.TypeError("Key must be a "+t+".")},l=function(e,t){for(var r=0,n=e.length/2-1,o=void 0;;){if(o=2*u.floor((r+n)/2),e[o]===t)return o+1;if(r>=n)return-1;t<e[o]?n=o-1:t>e[o]&&(r=o+1)}},g=function(e){for(var t,r,n=0,o=e.length;n<o;n+=2){var a=e[n],i=e[n+1];for(t=n-2;t>-1&&!(e[t]<=a);t-=2)for(r=t;r<t+2;r++)e[r+2]=e[r];e[t+2]=a,e[t+3]=i}};!(function(e){if(v.assign)s.assign(c.prototype,e);else for(var t in e)c.prototype[t]=e[t]})({getData:function(e){return this.get(e,!0)},getMetadata:function(e){var t=this.get(e),r={};if(!t)return t;for(var n in t)"data"!==n&&(r[n]=t[n]);return r}}),p?i.exports=c:a.DataCache=c})(typeof window===e?window:typeof global===e?global:this,this.module,Date,Math,Object)})();