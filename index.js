const Discord = require('discord.js');
const Axios = require('axios');
const dEmbed = Discord.MessageEmbed;
const Bot = new Discord.Client();
const Prefix = '.';
let Footer; let Help;
const pres = {'status': 'idle', 'activity': {'type': 'LISTENING', 'name': `messages, waiting for ${Prefix}help`}}

function ErrorEmbed(Title, Error) {
  return new dEmbed()
    .setTitle('Error')
    .setColor('#FF0000')
    .setFooter(Footer)
    .addField(`__${Title}__`, Error);
}

function bDate(d) {
  // d: 2014-08-29T23:08:36.810Z (Creation time of axios)
  return d.split('.')[0].replace('T', ' ');
}

Bot.on('ready', () => {
  try {
    Axios.get('http://localhost:64812/v2/embed?src=stable&force=false&q=BotStartupTest')
  } catch (e) {
    console.error('Use docker and start the container to run this bot.');
    process.exit(0);
  }
  Bot.user.setPresence(pres);
  console.log(`${Bot.user.username} is ready to go!`);
  console.log('Guilds:');
  Bot.guilds.cache.forEach((Guild) => {
    console.log(`  ${Guild.name}, ${Guild.memberCount} members, ID: ${Guild.id}`);
  });
  Footer = `${Bot.user.username}, coded by <h1>Index.Js</h1>#5650`;
  Help = new dEmbed()
    .setColor('#00FF00')
    .setTitle('Bot Help')
    .setFooter(Footer)
    .addFields([
      {'name': '__Invite__', 'value': `https://discord.com/oauth2/authorize?client_id=${Bot.user.id}&scope=bot&permissions=2048`},
      {'name': '__Commands__', 'value': `${Prefix}help (Alias: ${Prefix}h), display this message.\n` +
      `${Prefix}search (Alias: ${Prefix}s) Search thru the discord.js documentation.\n` +
      `${Prefix}npm (Alias: ${Prefix}n) Search thru npm packages.`}
    ]);
});

Bot.on('userUpdate', (o, n) => {
  if(n.id === Bot.user.id && Bot.user.presence.status === 'online')
    Bot.user.setPresence(pres);
});

Bot.on('message', async (m) => {
  if(m.channel.type === 'dm' && m.author.id !== Bot.user.id && !m.content.startsWith('.n') && !m.content.startsWith('.s'))
    return m.channel.send(Help);

  if(!m.content.startsWith(Prefix)) return;

  let cmd = m.content.slice(Prefix.length).split(' ')[0];
  let arg = m.content.slice(Prefix.length).split(' '); arg = arg.length < 2? null : arg[1];

  if(m.author.bot) return m.react('❌');

  console.log(`${m.author.tag} - ${m.content}`)

  if(cmd === 'help' || cmd === 'h')
    return m.channel.send(Help);

  else if(cmd === 'search' || cmd === 's') {
    if(arg === null)
      return m.channel.send(ErrorEmbed('Query error', `You need to provide what to look up, example:\n \`${Prefix}${cmd} Message#edit\``))
    if(!arg.match(/[a-z\.#]/gi)) {
      return m.channel.send(ErrorEmbed('Query error', 'Your query can only contain these characters: a-z A-Z . #'));
    }
    let resp = await Axios.get(`http://localhost:64812/v2/embed?src=stable&force=false&q=${arg.replace('.', '#').replace('#', '%23')}`);
    m.channel.send(new dEmbed(resp.data));
  }
  else if(cmd === 'npm' || cmd === 'n') {
    if(arg === null)
      return m.channel.send(ErrorEmbed('Query Error', `You need to provide what to look up, example:\n \`${Prefix}${cmd} axios\``))
    let npm;
    try {
      npm = (await Axios.get(`https://registry.npmjs.org/${arg}`)).data;
    } catch(e) {
        return m.channel.send(ErrorEmbed('Package Error', 'No such package'));
    }
    let deps = npm.versions[npm['dist-tags'].latest].dependencies;
    let depstring = '';
    if(deps && Object.keys(deps)/* Dictionaries don't have .length */.length > 0) {
      Object.entries(deps).forEach((dep) => {depstring += `${dep[0]} ${dep[1]}\n`;});
      depstring = depstring.slice(0, -1);
      let lit = `  [${Object.keys(deps).length} in total]`;
      if(depstring.length > 1024) depstring = depstring.slice(0, 1024 - lit.length) + lit;
    } else depstring = 'None!';
    let maintainers = [];
    npm.maintainers.forEach((main) => {maintainers.push(main.name)}); maintainers = maintainers.join(', ');
    let emb = new dEmbed()
      .setColor('#000000')
      .setTitle(npm.name)
      .setFooter(Footer)
      .addFields([
        { 'name': 'Version', 'value': npm['dist-tags'].latest, 'inline': true },
        { 'name': 'License', 'value': npm.license, 'inline': true },
        { 'name': 'Author', 'value': npm.author? npm.author.name : 'None', 'inline': true },
        { 'name': 'Creation Date', 'value': bDate(npm.time.created), 'inline': true },
        { 'name': 'Modification Date', 'value': bDate(npm.time.modified), 'inline': true },
        { 'name': 'Main File', 'value': npm.versions[npm['dist-tags'].latest].main, 'inline': true },
        { 'name': 'Dependencies', 'value': depstring, 'inline': true },
        { 'name': 'Maintainers', 'value': maintainers, 'inline': true },
        { 'name': 'URL', 'value': `[Here](https://www.npmjs.com/package/${arg} 'Click')`, 'inline': true }
      ]);
    m.channel.send(emb);
  }
});

Bot.login(require('./Token.json').Token)
