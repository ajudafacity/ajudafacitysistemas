"use strict";(self.webpackChunkajudafacitysistemas=self.webpackChunkajudafacitysistemas||[]).push([[4787],{12194:(t,e,a)=>{a.r(e),a.d(e,{default:()=>h});a(96540);var s=a(34164),r=a(61213),l=a(17559),n=a(26820),i=a(62557),c=a(41463),o=a(51107),g=a(74848);function u(t){let{title:e}=t;return(0,g.jsxs)(g.Fragment,{children:[(0,g.jsx)(r.be,{title:e}),(0,g.jsx)(c.A,{tag:"doc_tags_list"})]})}function d(t){let{tags:e,title:a}=t;return(0,g.jsx)(r.e3,{className:(0,s.A)(l.G.page.docsTagsListPage),children:(0,g.jsx)("div",{className:"container margin-vert--lg",children:(0,g.jsx)("div",{className:"row",children:(0,g.jsxs)("main",{className:"col col--8 col--offset-2",children:[(0,g.jsx)(o.A,{as:"h1",children:a}),(0,g.jsx)(i.A,{tags:e})]})})})})}function h(t){const e=(0,n.b)();return(0,g.jsxs)(g.Fragment,{children:[(0,g.jsx)(u,{...t,title:e}),(0,g.jsx)(d,{...t,title:e})]})}},56133:(t,e,a)=>{a.d(e,{A:()=>i});a(96540);var s=a(34164),r=a(28774);const l={tag:"tag_zVej",tagRegular:"tagRegular_sFm0",tagWithCount:"tagWithCount_h2kH"};var n=a(74848);function i(t){let{permalink:e,label:a,count:i,description:c}=t;return(0,n.jsxs)(r.A,{href:e,title:c,className:(0,s.A)(l.tag,i?l.tagWithCount:l.tagRegular),children:[a,i&&(0,n.jsx)("span",{children:i})]})}},62557:(t,e,a)=>{a.d(e,{A:()=>o});a(96540);var s=a(26820),r=a(56133),l=a(51107);const n={tag:"tag_Nnez"};var i=a(74848);function c(t){let{letterEntry:e}=t;return(0,i.jsxs)("article",{children:[(0,i.jsx)(l.A,{as:"h2",id:e.letter,children:e.letter}),(0,i.jsx)("ul",{className:"padding--none",children:e.tags.map((t=>(0,i.jsx)("li",{className:n.tag,children:(0,i.jsx)(r.A,{...t})},t.permalink)))}),(0,i.jsx)("hr",{})]})}function o(t){let{tags:e}=t;const a=(0,s.Q)(e);return(0,i.jsx)("section",{className:"margin-vert--lg",children:a.map((t=>(0,i.jsx)(c,{letterEntry:t},t.letter)))})}},26820:(t,e,a)=>{a.d(e,{Q:()=>l,b:()=>r});var s=a(21312);const r=()=>(0,s.T)({id:"theme.tags.tagsPageTitle",message:"Tags",description:"The title of the tag list page"});function l(t){const e={};return Object.values(t).forEach((t=>{const a=function(t){return t[0].toUpperCase()}(t.label);e[a]??=[],e[a].push(t)})),Object.entries(e).sort(((t,e)=>{let[a]=t,[s]=e;return a.localeCompare(s)})).map((t=>{let[e,a]=t;return{letter:e,tags:a.sort(((t,e)=>t.label.localeCompare(e.label)))}}))}}}]);