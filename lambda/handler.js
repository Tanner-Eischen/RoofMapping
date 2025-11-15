exports.handler = async function(event) {
  console.log(JSON.stringify({ event }));
  return { status: 'ok', timestamp: new Date().toISOString() };
};

