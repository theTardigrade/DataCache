!(function(){var e="object",t="function",r="string",n="number",o="undefined";!(function(a,f,i,u){function s(t){var f=(function(){var e=t?t.size:NaN,r=e===n||isNaN(e)?e:parseInt(e,10);return r=u.min(r,u.pow(2,32)-1),u.max(r,0)})(),s=this._debugCache=isNaN(f)?[]:new Array(f),p=r,l=(function(){var e="The only allowable key types are ";return c.forEach((function(t,r,n){var o='"'+t+'"';e+=r<n.length-2?o+", ":r<n.length-1?o:" and "+o+"."})),function(t){var r=c.some((function(e){return t===e}));if(!r)throw TypeError(e);p=t.toLowerCase()}})();t&&t.keyType&&l(t.keyType),this.get=function(e,t){d(e,p);var r=y(s,e);return r===-1?void 0:t?s[r].data:s[r]},this.set=function(t,r){p||l(typeof t),d(t,p);var n=y(s,t);n===-1&&(n=s.length+1),typeof r===e&&h.freeze&&a.Object.freeze(r);var o={data:r,updated:h.now?i.now():(new i).getTime()};return o.created=s[n]&&s[n].created?s[n].created:o.updated,s[n-1]=t,s[n]=o,v(s),o},this.unset=function(e){var t,r=y(s,e),n=s.length;if(r===-1)return!1;if(n>2)for(t=1,temp;t>=0;t--)temp=s[r-t],s[r-t]=s[n-t-1],s[n-t-1]=temp;for(t=0;t<2;t++)s.pop();return!v(s)},this.iterate=function(e,t){for(var r=s.length,n=0,r=s.length;n<r&&typeof s[n]!==o;++n)e(t?s[index].data:s[index])},this.clear=function(){return!!(s=[])}}var p=typeof f===e&&typeof f.exports===e&&typeof process===e&&typeof process.versions==e&&!isNaN(parseFloat(process.versions.node,10)),c=[r,n],h={now:typeof i.now===t,freeze:typeof Object.freeze===t},d=function(e,t){if(typeof e!==t)throw new TypeError("Key must be a "+t+".")},y=function(e,t){for(var r,n=0,o=e.length/2-1;;){if(r=2*u.floor((n+o)/2),e[r]===t)return r+1;if(n>=o)return-1;t<e[r]?o=r-1:t>e[r]&&(n=r+1)}},v=function(e){for(var t,r,n,o,a=0,f=e.length;a<f;a+=2){for(t=e[a],r=e[a+1],n=a-2;n>-1&&!(e[n]<=t);n-=2)for(o=n;o<n+2;o++)e[o+2]=e[o];e[n+2]=t,e[n+3]=r}};!(function(e){for(var t in e)s.prototype[t]=e[t]})({getData:function(e){var t=this.get(e);return t?t.data:t},getMetadata:function(e){var t=this.get(e),r={};if(!t)return t;for(var n in t)"data"!==n&&(r[n]=t[n]);return r}}),p?f.exports=s:a.DataCache=s})(typeof window===e?window:typeof global===e?global:this,this.module,Date,Math)})();