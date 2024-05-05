import { Telegraf, Markup } from "telegraf";
import { config } from "./config.js"

const bot = new Telegraf(config.telegramKey)

// VARS
let setListName = false
let createListOnGet = false
let getListsIs = false

let lists = []
let wordToAdd = ''

let getdata_keyboards = []
let lists_keyboards = []
let wordlist_keyboard = []

/////// COMMANDS
bot.telegram.setMyCommands([
  {
    command: 'start',
    description: 'Get started.',
  },
  {
    command: 'help',
    description: 'About an app / if you confused.',
  },
  {
    command: 'getlists',
    description: 'Get / create your word lists.',
  },
])

///// COMUNICATIONS
bot.start(ctx => {
  ctx.reply(`Welcome, <b>${getLatin(ctx.message.from.first_name)}</b>!
  \nThis is an application made by <b>Diamond Niam</b> for learning English language.
  \nWe follow only native ways to learn it in case: <i>sentence -> image association -> word</i>.
  \nIt means that we target on <ins>maximum triggers and mind chains</ins> in you from word to reach maximum impact in learning.
  \nThis application was built mostly for its author for learning English and iprove development skills most. But it will glad to see your attention about it. I have pleasant to see how it usefull for community.`, {
  chat_id: ctx.chat.id,
  parse_mode: 'HTML'}),
  setTimeout(() => {
    ctx.reply('Type a sentence you need to destruct to get started...', {chat_id: ctx.chat.id})
  }, 1000)
}
)

bot.command('help', ctx => {
  ctx.reply(`The app follow only <ins>native ways</ins> to learn it in case: <i>sentence -> image association -> word</i>.
  \n<b>Follow these steps:</b>\n- Just type a sentence that include the word.\n- Choose word in the sentence.\n- Optionally add word to your list that previously created (/getlists).\n- Back to your list at time you need.
  \nContact @diamondniam to get more information / ask a question.`, {
    parse_mode: 'HTML'
  })
})

bot.command('menu', async (ctx) => {
  await ctx.reply('this is text', Markup
    .keyboard([
      ['/getlists']
    ])
    .oneTime()
    .resize()
  )
})


/////// GET FUNCTIONS
async function getData(word) {
  try {
    let addres = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
    let response = await addres.json()
    return response
  } catch (error) {
  }
}

async function getImage(sentence) {
  let request = sentence.replace(' ', '%')
  // const url = `https://serpapi.com/search.json?q=Apple&engine=google_images&ijn=0` 
  const url = `https://real-time-image-search.p.rapidapi.com/search?query=${request}&size=large&aspect_ratio=square&region=ru`
  const options = { 
    method: 'GET', 
    headers: { 
      'X-RapidAPI-Key': '1a417df921msh71b6e5da0f82addp10a572jsnf2c2d4fcae6d', 
      'X-RapidAPI-Host': 'real-time-image-search.p.rapidapi.com' 
    } 
  }
  
  try { 
    const response = await fetch(url, options)
    const result = await response.json()
    return result.data[0].url
    // return result.images_results[0].thumbnail
  } catch (error) { 
  }
}

////// FORMAT FUNCTIONS
function getFormatedSentence(word, sentence) {
  let array = sentence.split(' ')
  let res = ''
  for (let i = 0; i < array.length; i++) {
    if (word === array[i]) {
      array.splice(i, 1, `<ins>${word}</ins>`)
    }
  }
  for (let i = 0; i < array.length; i++) {
    if (i != array.length - 1) {
      res += array[i] + ' '
    } else {
      res += array[i]
    }
  }
  return res
}

function getLatin(word) {
  var a = {"Ё":"YO","Й":"I","Ц":"TS","У":"U","К":"K","Е":"E","Н":"N","Г":"G","Ш":"SH","Щ":"SCH","З":"Z","Х":"H","Ъ":"'","ё":"yo","й":"i","ц":"ts","у":"u","к":"k","е":"e","н":"n","г":"g","ш":"sh","щ":"sch","з":"z","х":"h","ъ":"'","Ф":"F","Ы":"I","В":"V","А":"A","П":"P","Р":"R","О":"O","Л":"L","Д":"D","Ж":"ZH","Э":"E","ф":"f","ы":"i","в":"v","а":"a","п":"p","р":"r","о":"o","л":"l","д":"d","ж":"zh","э":"e","Я":"Ya","Ч":"CH","С":"S","М":"M","И":"I","Т":"T","Ь":"'","Б":"B","Ю":"YU","я":"ya","ч":"ch","с":"s","м":"m","и":"i","т":"t","ь":"'","б":"b","ю":"yu"}

  return word.split('').map(function (char) { 
    return a[char] || char
  }).join("")
}

////// INLINE KEYBOARDS
const inlineWordList = Markup.inlineKeyboard([
  Markup.button.callback('Yes', 'add_word'),
  Markup.button.callback('No', 'decline'),
])

function wordListInlines(list) {
  wordlist_keyboard = []
  for (let i = 0; i < list.contains.length; i++) {
    wordlist_keyboard.push([{ 'text': `${list.contains[i]}`, 'callback_data': `${list.contains[i]}` }])
  }
  if (!getListsIs) {
    wordlist_keyboard.push([{ 'text': `> CANCEL`, 'callback_data': `cancel_create_list}` }])
  }
  return wordlist_keyboard
}

function getInlines(message) {
  let words = message.split(' ')
  getdata_keyboards = []
  for (let i = 0; i < words.length; i++) {
    let word = words[i].replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '').toUpperCase()
    if (word.length > 1) {
      getdata_keyboards.push([{ 'text': `${word}`, 'callback_data': `${word}` }])
    }
  }
  return getdata_keyboards
}

function getLists() {
  lists_keyboards = []
  for (let i = 0; i < lists.length; i++) {
    lists_keyboards.push([{ 'text': `${lists[i].name}`, 'callback_data': `${lists[i].name}` }])
  }
  lists_keyboards.push([{ 'text': `> CREATE NEW`, 'callback_data': `create_list` }])
  return lists_keyboards
}

/////// ADD WORD LIST: YES / NO 
bot.action('add_word', async ctx => {
  getListsIs = false
  if (lists[0]) {
    ctx.deleteMessage()  
    ctx.sendMessage('Add to list:', {
      chat_id: ctx.chat.id,
      reply_markup: {
        inline_keyboard: getLists()
      }
    })
    getListsActions()
  } else {
    setListName = true
    ctx.editMessageText('You have no lists. Create one. Set the name: ')
  }
})

bot.action('decline', async ctx => {
  ctx.editMessageText('Skipped!')
  setTimeout(() => {
    ctx.deleteMessage()
  }, 2000)
})

////// CREATE LIST ACTION
bot.action('create_list', ctx => {
  if (getListsIs) {
    createListOnGet = true
    setListName = true
    ctx.editMessageText('Set the name: ', { 
      chat_id: ctx.chat.id,
      reply_markup: {
        inline_keyboard: [
          [{ 'text': `> CANCEL`, 'callback_data': `cancel_create_list` }]
        ]
      }
    })
  } else {
    createListOnGet = false
    setListName = true
    ctx.editMessageText('Set the name: ', { chat_id: ctx.chat.id })
  }
})

////// CANCEL CREATE LIST ACTION
bot.action('cancel_create_list', ctx => {
  ctx.deleteMessage()
})

////// GET LISTS
bot.command('getlists', (ctx) => {
  getListsIs = true
  ctx.sendMessage('Your Lists:', {
    chat_id: ctx.chat.id,
    reply_markup: {
      inline_keyboard: getLists()
    }
  })
  getListsActions()
  getActions()
})

///// LISTS CONTAINS ACTIONS
function getListsActions() {
  for (let i = 0; i < lists.length; i++) {
    bot.action(`${lists[i].name}`, async ctx => {
      if (getListsIs) {
        if (lists[i].contains[0]) {
          ctx.deleteMessage()
          ctx.reply(`Contains:`, {
            chat_id: ctx.chat.id,
            reply_markup: {
              inline_keyboard: wordListInlines(lists[i])
          } })
        } else {
          ctx.deleteMessage()
          ctx.reply(`List <b>"${lists[i].name}"</b> is empty!`, {
            chat_id: ctx.chat.id, parse_mode: 'HTML'
          })
        }
      } else {
        lists[i].contains.push(wordToAdd)
        ctx.editMessageText(`Succesfully added: <b>"${wordToAdd}"</b> to <b>"${lists[i].name}"</b>.`, {
          parse_mode: 'HTML'
        })
        setTimeout(() => {
          ctx.deleteMessage(ctx.message, ctx.chat.id)
        }, 3000)
      }
    })
  }
}

////// GET ACTIONS
function getActions(sentence) {
  for (let i = 0; i < getdata_keyboards.length; i++) {
    let response = getdata_keyboards[i][0].text
    bot.action(`${response}`, async ctx => {
      wordToAdd = response
      let chatId = ctx.chat.id
      current = response
      let data = await getData(response).then(data => { return data })
      let phonetic = ''

      try {
        if (data[0].phonetic == undefined) {phonetic = ''} else {phonetic = `[${data[0].phonetic}]`}

        ctx.deleteMessage(ctx.message, chatId)

        // let imageResponse = await getImage(sentence).then(data => { return data })
        // await ctx.sendPhoto(imageResponse, {
        // 'caption': `Context: ${getFormatedSentence(response.toLowerCase(), sentence.toLowerCase())}.
        // \n<b>${response}</b> ${phonetic.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '')} — ${((data[0].meanings[0].definitions[0].definition).toLowerCase())}`,
        // 'parse_mode': 'HTML',
        // 'chat_id': chatId
        // })

        let imageResponse = await getImage(sentence).then(data => { return data })

        if (sentence.split(' ').length > 1) {
          await ctx.sendPhoto(imageResponse, {
          'caption': `Context: ${getFormatedSentence(response.toLowerCase(), sentence.toLowerCase())}.
          \n<b>${response}</b> ${phonetic.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '')} — ${((data[0].meanings[0].definitions[0].definition).toLowerCase())}`,
          'parse_mode': 'HTML',
          'chat_id': chatId
          })
        } else {
          await ctx.sendPhoto(imageResponse, {
          'caption': `<b>${response}</b> ${phonetic.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '')} — ${((data[0].meanings[0].definitions[0].definition).toLowerCase())}`,
          'parse_mode': 'HTML',
          'chat_id': chatId
          })
        }

        // if (sentence.split(' ').length > 1) {
        //   await ctx.sendMessage(`Context: ${getFormatedSentence(response.toLowerCase(), sentence.toLowerCase())}.
        //   \n<b>${response}</b> ${phonetic.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '')} — ${((data[0].meanings[0].definitions[0].definition).toLowerCase())}`, { chat_id: chatId, parse_mode: 'HTML' })
        // } else {
        //   await ctx.sendMessage(`<b>${response}</b> ${phonetic.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '')} — ${((data[0].meanings[0].definitions[0].definition).toLowerCase())}`, { chat_id: chatId, parse_mode: 'HTML' })
        // }

        if (!getListsIs) {
          await ctx.reply('Want to add the word to your list?', inlineWordList, { chat_id: ctx.chat.id })
        }
      } catch (error) {
        ctx.sendMessage(`<b>*The word definition not exist.</b>
        \nChoose one from: ${sentence}.`, {
          reply_markup: {
            inline_keyboard: getdata_keyboards
          },
          chat_id: ctx.chat.id,
          parse_mode: 'HTML'
        })
        ctx.deleteMessage(ctx.message, chatId)
      }
    })
  }
}

////// LISTENER
bot.on('message', ctx => {
  let text = ctx.message.text

  if (text[0] != '/') {
    if (!setListName) {
      getListsIs = false
      getInlines(text)
      let message = ''
      message = `Your word: ${ text }.`
      ctx.sendMessage(message, {
        reply_markup: {
          inline_keyboard: getdata_keyboards
        },
        chat_id: ctx.chat.id
      })
      getActions(text)
    }
  
    if (setListName) {
      if (createListOnGet) {
        lists.push({ name: ctx.message.text, contains: [] })
        ctx.sendMessage(`List <b>"${ctx.message.text}"</b> succesfully added!`, { chat_id: ctx.chat.id, parse_mode: 'HTML' })
      } else {
        lists.push({ name: ctx.message.text, contains: [] })
        ctx.sendMessage('Add to list:', {
          chat_id: ctx.chat.id,
          reply_markup: {
            inline_keyboard: getLists()
          }
        })
        getListsActions()
      }
      setListName = false
    }
  }
})

bot.launch()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))