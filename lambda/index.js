'use strict';
const Alexa = require('ask-sdk-core');
const {callBridge,escapeSpeech}=require('./bridge');
const intro='Welcome to Aurora. You can ask for today’s plan, your next task, or add a note or task. What would you like?';
const speak=(h,text,keep=false)=>{const b=h.responseBuilder.speak(escapeSpeech(text));return (keep?b.reprompt('What would you like to do?'):b).getResponse();};
const Launch={canHandle:h=>Alexa.getRequestType(h.requestEnvelope)==='LaunchRequest',handle:h=>speak(h,intro,true)};
const Read={
 canHandle:h=>Alexa.getRequestType(h.requestEnvelope)==='IntentRequest'&&['TodayIntent','NextTaskIntent','RoutineIntent'].includes(Alexa.getIntentName(h.requestEnvelope)),
 async handle(h){const name=Alexa.getIntentName(h.requestEnvelope);const action={TodayIntent:'today',NextTaskIntent:'next',RoutineIntent:'routines'}[name];const result=await callBridge(action,{},h.requestEnvelope.request.requestId);return speak(h,result.speech,true);}
};
const Draft={
 canHandle:h=>Alexa.getRequestType(h.requestEnvelope)==='IntentRequest'&&['AddNoteIntent','AddTaskIntent'].includes(Alexa.getIntentName(h.requestEnvelope)),
 handle(h){const text=Alexa.getSlotValue(h.requestEnvelope,'text');if(!text||text.length>500)return speak(h,'Please give a short note or task, up to five hundred characters.',true);
 const action=Alexa.getIntentName(h.requestEnvelope)==='AddNoteIntent'?'note':'task';
 h.attributesManager.setSessionAttributes({pending:{action,text}});
 return speak(h,`Save this ${action} in Aurora: ${text}? Say yes to save, or no to cancel.`,true);}
};
const Confirm={
 canHandle:h=>Alexa.getRequestType(h.requestEnvelope)==='IntentRequest'&&['AMAZON.YesIntent','AMAZON.NoIntent'].includes(Alexa.getIntentName(h.requestEnvelope)),
 async handle(h){const {pending}=h.attributesManager.getSessionAttributes();h.attributesManager.setSessionAttributes({});
 if(Alexa.getIntentName(h.requestEnvelope)==='AMAZON.NoIntent')return speak(h,'Cancelled. Nothing was saved.',true);
 if(!pending)return speak(h,'There is nothing waiting for confirmation.',true);
 const result=await callBridge(pending.action,{text:pending.text},h.requestEnvelope.request.requestId);return speak(h,result.speech,true);}
};
const Help={canHandle:h=>Alexa.getRequestType(h.requestEnvelope)==='IntentRequest'&&Alexa.getIntentName(h.requestEnvelope)==='AMAZON.HelpIntent',handle:h=>speak(h,intro,true)};
const Stop={canHandle:h=>Alexa.getRequestType(h.requestEnvelope)==='IntentRequest'&&['AMAZON.StopIntent','AMAZON.CancelIntent'].includes(Alexa.getIntentName(h.requestEnvelope)),handle:h=>speak(h,'Goodbye.')};
const End={canHandle:h=>Alexa.getRequestType(h.requestEnvelope)==='SessionEndedRequest',handle:h=>h.responseBuilder.getResponse()};
const Fallback={canHandle:h=>Alexa.getRequestType(h.requestEnvelope)==='IntentRequest',handle:h=>speak(h,'I can read your plan or save a note or task. Please try one of those.',true)};
const ErrorHandler={canHandle:()=>true,handle(h,e){
 // Never log request envelopes, credentials, health details or note text.
 const message=e.code==='NOT_CONNECTED'?'The Alexa skill is ready, but its private Aurora connection has not been configured yet.':'I could not confirm that operation. Check Aurora before repeating it. I will not retry automatically.';
 return speak(h,message);
}};
exports.handler=Alexa.SkillBuilders.custom().addRequestHandlers(Launch,Read,Draft,Confirm,Help,Stop,End,Fallback).addErrorHandlers(ErrorHandler).lambda();
