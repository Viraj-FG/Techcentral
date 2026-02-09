import{j as e}from"./ui-vendor-CRu_cuPE.js";import{u as U,r as a}from"./react-vendor-DwZQO67Z.js";import{d as _,X as V,G as K,V as O}from"./index-D4bhw5kJ.js";import{C as B}from"./chart-column-Drpt_8Xs.js";import"./chart-vendor-BDCxrQ3h.js";import"./supabase-vendor-BS1x--yE.js";import"./animation-vendor-C-lCNj7M.js";/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const q=_("Pen",[["path",{d:"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",key:"1a8usu"}]]),x={ml:{label:"ml",conversion:1,step:50,maxGoal:5e3,defaultGoal:2e3},l:{label:"L",conversion:1e3,step:.1,maxGoal:5,defaultGoal:2},oz:{label:"oz",conversion:29.5735,step:1,maxGoal:200,defaultGoal:64},cups:{label:"cups",conversion:236.588,step:.5,maxGoal:20,defaultGoal:8}},p=[{day:"Mon",percentage:85},{day:"Tue",percentage:92},{day:"Wed",percentage:78},{day:"Thu",percentage:100},{day:"Fri",percentage:88},{day:"Sat",percentage:95},{day:"Sun",percentage:70}];function le(){const C=U(),[l,I]=a.useState("oz"),[i,M]=a.useState(1892.7),[n,m]=a.useState(0),[d,g]=a.useState(12),[A,f]=a.useState(!1),[w,j]=a.useState(!1),[T,v]=a.useState(!1),[z,b]=a.useState(!1),[G,N]=a.useState(!1),[E,y]=a.useState(!1),[k,S]=a.useState(0),[F,Y]=a.useState(new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}));a.useEffect(()=>{const t=setInterval(()=>{Y(new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}))},1e3);return()=>clearInterval(t)},[]);const s=x[l],c=t=>{const r=t/s.conversion;return l==="l"?Math.round(r*10)/10:Math.round(r)},u=t=>t*s.conversion,h=c(n),o=c(i),L=Math.round(n/i*100),P=()=>{if(n>=i)return;f(!0);const t=u(d);m(r=>Math.min(r+t,i)),setTimeout(()=>f(!1),300)},D=t=>{const r=x[t];I(t),g(r.step*10)},R=t=>{M(u(t))},X=()=>{m(0),v(!1)},$=()=>{S(h),b(!0)},W=()=>{m(u(k)),b(!1)},H=n/i*100;return e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"fixed inset-0 bg-black text-white overflow-hidden",children:[e.jsx("div",{className:"h-safe-area-inset-top"}),e.jsxs("div",{className:"h-screen flex flex-col px-5 pb-safe-area-inset-bottom",children:[e.jsx("div",{className:"flex items-center justify-between pt-3 pb-2 text-xs",children:e.jsx("div",{children:F})}),e.jsx("div",{className:"flex items-center justify-end py-2",children:e.jsx("button",{className:"w-10 h-10 flex items-center justify-center active:scale-90 transition-transform",onClick:()=>C(-1),children:e.jsx(V,{className:"w-6 h-6 text-white/60"})})}),T&&e.jsx("div",{className:"absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-5",children:e.jsxs("div",{className:"bg-white/10 rounded-2xl p-5 max-w-sm w-full backdrop-blur-md border border-white/20",children:[e.jsx("div",{className:"text-lg mb-2",children:"Reset Today's Progress?"}),e.jsx("div",{className:"text-sm text-white/60 mb-5",children:"This will reset your water intake to 0 for today."}),e.jsxs("div",{className:"flex gap-3",children:[e.jsx("button",{onClick:()=>v(!1),className:"flex-1 bg-white/10 text-white py-3 rounded-xl active:scale-95 transition-all",children:"Cancel"}),e.jsx("button",{onClick:X,className:"flex-1 bg-red-500 text-white py-3 rounded-xl active:scale-95 transition-all",children:"Reset"})]})]})}),z&&e.jsx("div",{className:"absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-5",children:e.jsxs("div",{className:"bg-white/10 rounded-2xl p-5 max-w-sm w-full backdrop-blur-md border border-white/20",children:[e.jsx("div",{className:"text-lg mb-4",children:"Edit Water Intake"}),e.jsxs("div",{className:"flex items-center gap-3 mb-5",children:[e.jsx("input",{type:"number",value:k,onChange:t=>S(Number(t.target.value)),step:s.step,min:0,max:o,className:"flex-1 bg-white/10 rounded-xl px-4 py-3 text-white text-lg outline-none focus:bg-white/15 transition-colors",autoFocus:!0}),e.jsx("span",{className:"text-white/60",children:s.label})]}),e.jsxs("div",{className:"flex gap-3",children:[e.jsx("button",{onClick:()=>b(!1),className:"flex-1 bg-white/10 text-white py-3 rounded-xl active:scale-95 transition-all",children:"Cancel"}),e.jsx("button",{onClick:W,className:"flex-1 bg-white text-black py-3 rounded-xl active:scale-95 transition-all",children:"Save"})]})]})}),G&&e.jsx("div",{className:"absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-5",children:e.jsxs("div",{className:"bg-white/10 rounded-2xl p-5 max-w-sm w-full backdrop-blur-md border border-white/20",children:[e.jsx("div",{className:"text-lg mb-4",children:"Weekly Progress"}),e.jsx("div",{className:"space-y-3 mb-5",children:p.map(t=>e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center justify-between text-sm mb-1",children:[e.jsx("span",{className:"text-white/60",children:t.day}),e.jsxs("span",{className:"text-white/80",children:[t.percentage,"%"]})]}),e.jsx("div",{className:"w-full h-2 bg-white/10 rounded-full overflow-hidden",children:e.jsx("div",{className:"h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-500",style:{width:`${t.percentage}%`}})})]},t.day))}),e.jsxs("div",{className:"text-xs text-white/40 mb-4",children:["Average: ",Math.round(p.reduce((t,r)=>t+r.percentage,0)/p.length),"% of daily goal"]}),e.jsx("button",{onClick:()=>N(!1),className:"w-full bg-white text-black py-3 rounded-xl active:scale-95 transition-all",children:"Close"})]})}),E&&e.jsx("div",{className:"absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-5",children:e.jsxs("div",{className:"bg-white/10 rounded-2xl p-5 max-w-sm w-full backdrop-blur-md border border-white/20",children:[e.jsx("div",{className:"text-lg mb-4",children:"Today's History"}),e.jsx("div",{className:"space-y-3 mb-5 max-h-64 overflow-y-auto",children:n>0?e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"bg-white/5 rounded-xl p-3",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:"text-sm text-white/60",children:"9:30 AM"}),e.jsxs("span",{className:"text-white",children:["12 ",s.label]})]})}),e.jsx("div",{className:"bg-white/5 rounded-xl p-3",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:"text-sm text-white/60",children:"11:15 AM"}),e.jsxs("span",{className:"text-white",children:["8 ",s.label]})]})}),e.jsx("div",{className:"bg-white/5 rounded-xl p-3",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:"text-sm text-white/60",children:"2:00 PM"}),e.jsxs("span",{className:"text-white",children:["10 ",s.label]})]})})]}):e.jsx("div",{className:"text-center py-8 text-white/40 text-sm",children:"No water intake recorded today"})}),e.jsx("button",{onClick:()=>y(!1),className:"w-full bg-white text-black py-3 rounded-xl active:scale-95 transition-all",children:"Close"})]})}),w&&e.jsxs("div",{className:"bg-white/10 rounded-2xl p-4 backdrop-blur-sm mb-3",children:[e.jsxs("div",{className:"mb-3",children:[e.jsx("div",{className:"text-xs text-white/60 mb-2",children:"Unit"}),e.jsx("div",{className:"flex gap-2",children:Object.keys(x).map(t=>e.jsx("button",{onClick:()=>D(t),className:`flex-1 py-2 rounded-lg text-sm transition-all ${l===t?"bg-white text-black":"bg-white/10 text-white/60 active:scale-95"}`,children:x[t].label},t))})]}),e.jsxs("div",{className:"mb-3",children:[e.jsx("div",{className:"text-xs text-white/60 mb-2",children:"Daily Goal"}),e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("input",{type:"number",value:o,onChange:t=>R(Number(t.target.value)),step:s.step,min:s.step,max:s.maxGoal,className:"flex-1 bg-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:bg-white/15 transition-colors"}),e.jsx("span",{className:"text-sm text-white/60",children:s.label})]})]}),e.jsx("button",{onClick:()=>j(!1),className:"w-full bg-white/10 text-white py-2 text-sm rounded-lg active:scale-95 transition-all",children:"Done"})]}),e.jsxs("div",{className:"flex-1 flex items-center gap-4 py-2 min-h-0",children:[e.jsx("div",{className:"flex-1 flex items-center justify-center min-h-0 z-0",style:{perspective:"1200px"},children:e.jsxs("div",{className:"relative w-full max-w-[120px] h-[35vh] max-h-[280px]",style:{transformStyle:"preserve-3d",transform:"rotateY(-8deg) translateY(-85px)"},children:[e.jsxs("div",{className:"absolute top-0 left-1/2 -translate-x-1/2 z-20",style:{transformStyle:"preserve-3d"},children:[e.jsx("div",{className:"w-16 h-4 rounded-full relative overflow-hidden",style:{background:"linear-gradient(135deg, #2563eb 0%, #1e40af 30%, #1e3a8a 60%, #172554 100%)",boxShadow:"0 4px 12px rgba(0,0,0,0.6), inset -3px -3px 6px rgba(0,0,0,0.4), inset 3px 3px 6px rgba(96,165,250,0.4)"},children:e.jsx("div",{className:"absolute top-0 left-2 w-6 h-1.5 bg-white/30 rounded-full blur-sm"})}),e.jsx("div",{className:"w-14 h-2.5 mx-auto mt-0.5 rounded-sm relative",style:{background:"linear-gradient(180deg, #1e3a8a 0%, #1e40af 50%, #1e3a8a 100%)",boxShadow:"inset 0 1px 3px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3)"},children:e.jsx("div",{className:"absolute inset-x-0 top-1/2 h-px bg-black/20"})}),e.jsx("div",{className:"w-12 h-7 mx-auto mt-0.5 rounded-sm relative",style:{background:"linear-gradient(135deg, #3b82f6 0%, #2563eb 30%, #1e40af 70%, #172554 100%)",boxShadow:"inset -2px 0 4px rgba(0,0,0,0.5), inset 2px 0 3px rgba(96,165,250,0.3)"},children:e.jsx("div",{className:"absolute top-1 left-1 w-2.5 h-3 bg-white/20 rounded-full blur-sm"})})]}),e.jsxs("div",{className:"absolute top-14 left-1/2 -translate-x-1/2 w-40 h-80 rounded-3xl overflow-hidden",style:{background:"linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 40%, rgba(0,0,0,0.15) 100%)",boxShadow:`
                      inset -12px 0 24px rgba(255,255,255,0.15),
                      inset 12px 0 24px rgba(0,0,0,0.4),
                      inset 0 -12px 24px rgba(0,0,0,0.25),
                      inset 0 12px 24px rgba(255,255,255,0.1),
                      -6px 0 20px rgba(0,0,0,0.4),
                      6px 0 20px rgba(0,0,0,0.3),
                      0 12px 32px rgba(0,0,0,0.5)
                    `,border:"1.5px solid rgba(255,255,255,0.15)",backdropFilter:"blur(10px)",transformStyle:"preserve-3d"},children:[e.jsxs("div",{className:"absolute bottom-0 left-0 right-0 transition-all duration-700 ease-out",style:{height:`${H}%`,background:`linear-gradient(180deg, 
                        rgba(56, 189, 248, 0.85) 0%,
                        rgba(14, 165, 233, 0.92) 25%,
                        rgba(6, 182, 212, 0.95) 50%,
                        rgba(8, 145, 178, 0.98) 75%,
                        rgba(3, 105, 161, 1) 100%
                      )`,boxShadow:`
                        inset -10px 0 20px rgba(255,255,255,0.4),
                        inset 10px 0 20px rgba(0,0,0,0.5),
                        inset 0 6px 12px rgba(255,255,255,0.3),
                        0 -4px 16px rgba(56, 189, 248, 0.6)
                      `},children:[e.jsx("div",{className:"absolute top-0 left-0 right-0 h-2 water-surface",style:{background:"linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 30%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0.5) 70%, transparent 100%)",filter:"blur(1px)"}}),e.jsx("div",{className:"absolute bottom-6 left-6 w-2.5 h-2.5 rounded-full bg-white/40 bubble shadow-lg"}),e.jsx("div",{className:"absolute bottom-10 right-8 w-2 h-2 rounded-full bg-white/35 bubble-slow shadow-md"}),e.jsx("div",{className:"absolute bottom-14 left-10 w-1.5 h-1.5 rounded-full bg-white/30 bubble-slower shadow-md"}),e.jsx("div",{className:"absolute bottom-16 right-12 w-1 h-1 rounded-full bg-white/25 bubble shadow-sm",style:{animationDelay:"0.5s"}}),e.jsx("div",{className:"absolute bottom-8 left-14 w-1 h-1 rounded-full bg-white/25 bubble-slow shadow-sm",style:{animationDelay:"1.5s"}}),e.jsx("div",{className:"absolute inset-0 shimmer",style:{background:"linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)",width:"40%"}})]}),e.jsx("div",{className:"absolute top-10 left-3 w-10 h-52 rounded-full",style:{background:"linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.2) 40%, rgba(255,255,255,0.05) 70%, transparent 100%)",filter:"blur(12px)"}}),e.jsx("div",{className:"absolute top-16 left-5 w-5 h-28 rounded-full",style:{background:"linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.3) 50%, transparent 100%)",filter:"blur(8px)"}}),e.jsx("div",{className:"absolute top-10 right-2.5 w-10 h-52 rounded-full",style:{background:"linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1) 80%, transparent 100%)",filter:"blur(10px)"}}),e.jsx("div",{className:"absolute inset-0",children:[25,50,75].map(t=>e.jsxs("div",{className:"absolute left-0 right-0 flex items-center",style:{bottom:`${t}%`},children:[e.jsx("div",{className:"w-6 h-[1.5px] bg-gradient-to-r from-white/30 to-white/10 ml-2.5 rounded-full"}),e.jsx("span",{className:"text-[10px] text-white/40 ml-1.5",style:{textShadow:"0 1px 2px rgba(0,0,0,0.5)"},children:l==="l"?c(i*t/100).toFixed(1):Math.round(c(i*t/100))})]},t))}),e.jsx("div",{className:"absolute bottom-3 left-6 right-6 h-10 rounded-full",style:{background:"radial-gradient(ellipse at center, rgba(255,255,255,0.1) 0%, transparent 70%)",filter:"blur(6px)"}})]}),e.jsx("div",{className:"absolute -bottom-2 left-1/2 -translate-x-1/2 w-32 h-10 rounded-full -z-10",style:{background:"radial-gradient(ellipse at center, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 40%, transparent 70%)",filter:"blur(12px)"}})]})}),e.jsxs("div",{className:"flex-1 flex flex-col justify-center gap-2",style:{transform:"translateY(-15px)"},children:[e.jsxs("div",{children:[e.jsx("div",{className:"text-4xl tracking-tight",children:l==="l"?h.toFixed(1):h}),e.jsx("div",{className:"text-xl text-white/60 mt-1",children:s.label}),e.jsxs("div",{className:"text-xs text-white/40 mt-1",children:[L,"% of ",l==="l"?o.toFixed(1):o,s.label," goal"]})]}),e.jsxs("div",{className:"bg-white/5 rounded-2xl p-3 backdrop-blur-sm",children:[e.jsxs("div",{className:"flex items-center justify-between mb-2",children:[e.jsxs("div",{className:"flex items-baseline gap-2",children:[e.jsx("span",{className:"text-2xl",children:l==="l"?d.toFixed(1):d}),e.jsx("span",{className:"text-xl text-white/60",children:s.label})]}),e.jsx("button",{onClick:()=>j(!w),className:"w-9 h-9 bg-white/10 rounded-full flex items-center justify-center active:scale-90 transition-transform",children:e.jsxs("div",{className:"flex flex-col gap-0.5",children:[e.jsx("div",{className:"w-3.5 h-0.5 bg-white"}),e.jsx("div",{className:"w-3.5 h-0.5 bg-white"}),e.jsx("div",{className:"w-3.5 h-0.5 bg-white"})]})})]}),e.jsx("div",{className:"text-[10px] text-white/40 mb-2",children:"Drank some water? Tap to add it."}),e.jsx("div",{className:"mb-3",children:e.jsx("input",{type:"range",min:s.step,max:o,step:s.step,value:d,onChange:t=>g(Number(t.target.value)),className:"w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer range-slider",style:{background:`linear-gradient(to right, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.4) ${d/o*100}%, rgba(255,255,255,0.1) ${d/o*100}%, rgba(255,255,255,0.1) 100%)`}})}),e.jsx("button",{onClick:P,disabled:n>=i,className:`w-full bg-white text-black py-3 rounded-full font-medium active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed ${A?"scale-[0.98]":""}`,children:"Add"})]}),e.jsxs("div",{className:"hidden xs:block",children:[e.jsx("div",{className:"text-lg text-white/60",children:l==="l"?c(n*7).toFixed(1):c(n*7)}),e.jsxs("div",{className:"text-xs text-white/40 mt-0.5",children:[s.label," drank this week"]})]})]})]}),e.jsxs("div",{className:"relative z-10 flex items-center justify-center gap-6 py-1",style:{transform:"translateX(90px)"},children:[e.jsx("button",{className:"p-2 active:scale-90 transition-transform",onClick:$,children:e.jsx(q,{className:"w-5 h-5"})}),e.jsxs("button",{className:"flex items-center gap-2 px-5 py-2.5 bg-white/10 rounded-full active:scale-95 transition-transform",onClick:()=>N(!0),children:[e.jsx(B,{className:"w-4 h-4"}),e.jsx("span",{className:"text-sm",children:"Plan"})]}),e.jsx("button",{className:"p-2 active:scale-90 transition-transform",onClick:()=>y(!0),children:e.jsx(K,{className:"w-5 h-5"})})]}),e.jsx("div",{className:"text-xs text-white/30 text-center pb-3 flex justify-center",children:e.jsx("div",{className:"scale-75",children:e.jsx(O,{})})})]})]}),e.jsx("style",{dangerouslySetInnerHTML:{__html:`
        /* Range Slider Styles */
        .range-slider::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        
        .range-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }

        /* Number Input Styles */
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          opacity: 1;
        }

        /* Water Surface Animation */
        @keyframes ripple {
          0%, 100% { 
            transform: translateX(0); 
            opacity: 0.5; 
          }
          50% { 
            transform: translateX(6px); 
            opacity: 0.7; 
          }
        }

        .water-surface {
          animation: ripple 3s ease-in-out infinite;
        }

        /* Bubble Animations */
        @keyframes bubble {
          0% { 
            transform: translateY(0) scale(1); 
            opacity: 0.4; 
          }
          100% { 
            transform: translateY(-80px) scale(0.3); 
            opacity: 0; 
          }
        }

        @keyframes bubble-slow {
          0% { 
            transform: translateY(0) scale(1); 
            opacity: 0.35; 
          }
          100% { 
            transform: translateY(-100px) scale(0.2); 
            opacity: 0; 
          }
        }

        @keyframes bubble-slower {
          0% { 
            transform: translateY(0) scale(1); 
            opacity: 0.3; 
          }
          100% { 
            transform: translateY(-120px) scale(0.15); 
            opacity: 0; 
          }
        }

        .bubble {
          animation: bubble 5s ease-in-out infinite;
        }

        .bubble-slow {
          animation: bubble-slow 6s ease-in-out infinite;
          animation-delay: 1s;
        }

        .bubble-slower {
          animation: bubble-slower 7s ease-in-out infinite;
          animation-delay: 2s;
        }

        /* Shimmer Animation */
        @keyframes shimmer {
          0% { 
            transform: translateX(0); 
          }
          50% { 
            transform: translateX(120px); 
          }
          100% { 
            transform: translateX(0); 
          }
        }

        .shimmer {
          animation: shimmer 4s ease-in-out infinite;
        }

        /* Safe Area Support */
        .h-safe-area-inset-top {
          height: env(safe-area-inset-top, 0);
        }

        .pb-safe-area-inset-bottom {
          padding-bottom: env(safe-area-inset-bottom, 0);
        }
      `}})]})}export{le as default};
