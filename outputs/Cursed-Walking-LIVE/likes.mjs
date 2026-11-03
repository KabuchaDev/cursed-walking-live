// Only event deltas are counted. totalLikeCount is never added to the counter.
export function initialState(){return {version:1,totalLikes:0,remainder:0,pending:0,spawned:0,recentIds:[],flight:null,lastIssue:null};}
export function receiveLikes(state,envelope,threshold=100){
 if(envelope?.event!=='like')return {changed:false,earned:0};
 const d=envelope.data;
 if(!d||!['number','string'].includes(typeof d.likeCount))return {changed:false,earned:0};
 const count=Number(d.likeCount);
 if(!Number.isSafeInteger(count)||count<=0||count>1000000)return {changed:false,earned:0};
 const rawId=d.msgId??d.common?.msgId??envelope.msgId;
 const id=rawId===undefined||rawId===null||rawId===''?null:String(rawId);
 if(id&&state.recentIds.includes(id))return {changed:false,earned:0};
 if(id){state.recentIds.push(id);if(state.recentIds.length>4096)state.recentIds.splice(0,state.recentIds.length-4096);}
 const sum=state.remainder+count,earned=Math.floor(sum/threshold);
 state.totalLikes+=count;state.remainder=sum%threshold;state.pending+=earned;
 return {changed:true,earned};
}
export function settle(state,result){
 if(!state.flight)return 'idle';
 if(result?.accepted===1){state.pending--;state.spawned++;state.flight=null;state.lastIssue=null;return 'spawned';}
 if(result?.accepted===0&&result.safeRetry===true){state.flight=null;state.lastIssue=result.error??result.response;return 'retry';}
 state.lastIssue='Ket qua chua chac chan; tam giu hang cho de tranh goi trung zombie.';
 return 'uncertain';
}
