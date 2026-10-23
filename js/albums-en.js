// 영어 화면의 앨범 소개 (albums.js의 id로 찾는다). 한국 앨범은 영문 표기 title·artist도 둔다
const EN = {
  1454691596: { country: 'USA', genre: 'Electronic · Moog synth', about: 'Canadian-born composer Mort Garson made this album for plants to listen to. The round, bubbly Moog sounds are cute and kind.' },
  1790521507: { country: 'Japan', genre: 'Ambient · New Age', about: "Hiroshi Yoshimura's album about green and the sounds of nature. Synth notes drip like water and feel as easy as wind through leaves." },
  1773946851: { country: 'Japan', genre: 'Environmental · Ambient', about: 'The debut of Hiroshi Yoshimura, who pioneered Japanese environmental music. Short piano and synth pieces turn the view outside like postcards, one at a time.' },
  1479717638: { country: 'Japan', genre: 'Environmental · Ambient', about: 'The only album by Satoshi Ashikawa, who started the ‘Wave Notation’ series with Hiroshi Yoshimura. Sounds spread slowly like ripples, perfect for roads at dusk.' },
  724435863: { country: 'UK', genre: 'Ambient', about: 'Brian Eno made it to play in airports, and it gave ‘ambient’ its name. Slow piano and voices you can listen to or let drift by.' },
  714499703: { country: 'USA · UK', genre: 'Ambient · Piano', about: "Harold Budd's piano, with reverb painted on by Brian Eno. Hazy and slow like light on water, made for night drives." },
  714416645: { country: 'USA', genre: 'Ambient · New Age', about: 'Brian Eno found Laraaji playing on the streets of New York and made this album with him. The shimmering zither feels like clear morning sun.' },
  1893766382: { country: 'Italy', genre: 'Ambient · New Age', about: 'The debut of Venetian musician Gigi Masin. Calm synths and piano linger like a sea breeze.' },
  1714304663: { country: 'Japan', genre: 'Folk · Chamber', about: 'Ichiko Aoba wrote it as a soundtrack for an imaginary island. Guitar, a whispering voice and strings spread like the smell of the sea.' },
  1663628050: { country: 'Norway', genre: 'Acoustic Folk', about: 'The debut of Kings of Convenience, two friends from Bergen. Just like the title, soft guitars and harmonies keep things calm.' },
  281116024: { country: 'UK', genre: 'Electronica · IDM', about: 'The first full album from Scottish brothers Boards of Canada. Faded synths, like old film, bring back childhood memories.' },
  1490459058: { country: 'USA', genre: 'Electronic · Chillwave', about: 'From Tycho, the project of designer and musician Scott Hansen. Bright synths and guitar keep time with the scenery passing by.' },
  1169245868: { country: 'UK', genre: 'Downtempo · Electronica', about: "British producer Bonobo's album about people on the move. Soft beats and sounds from around the world suit a long journey." },
  1451056840: { country: 'Germany', genre: 'Modern Classical · Piano', about: "German pianist Nils Frahm recorded it at night with felt on the strings so he wouldn't wake his neighbors. You can hear the keys and even his breathing up close." },
  1390704147: { country: 'Iceland', genre: 'Neo-classical', about: 'Icelandic composer Ólafur Arnalds plays piano while other pianos answer him on their own. The sound rises slowly.' },
  258198881: { country: 'UK', genre: 'Dream Pop', about: 'The signature album of Scottish band Cocteau Twins. Misty guitars and half-understood vocals feel like a window on a rainy day.' },
  1440864756: { country: 'USA', genre: 'Jazz · Cool Jazz', about: 'Trumpeter Chet Baker sings it himself. His soft, lazy voice and trumpet fit a slow afternoon.' },
  1473993015: { country: 'Canada', genre: 'Dream Pop · Indie', about: 'From Montreal band Men I Trust. Low basslines and a calm voice, steady like a night drive.' },
  1581582605: { country: 'UK', genre: 'Ambient', about: 'Jon Hopkins built this meditation music from sounds recorded in a cave in Ecuador. Synths breathe slowly over forest and water.' },
  1498704719: { country: 'Japan', genre: 'Piano · Film Score', about: 'Piano pieces by Joe Hisaishi, famous for Studio Ghibli scores. Lots of familiar melodies to hum along to with your passenger.' },
  1625058458: { country: 'USA', genre: 'Jazz · Pop', about: "Norah Jones's debut. Warm piano and voice make any ride feel easy." },
  1422655717: { country: 'USA · Brazil', genre: 'Bossa Nova · Jazz', about: 'The bossa nova classic by saxophonist Stan Getz and guitarist João Gilberto, with ‘The Girl from Ipanema’. Try it with the window down a little.' },
  1078914477: { country: 'Japan', genre: 'Jazz Hip-hop', about: 'The second album by Japanese producer Nujabes. Finely woven jazz piano and strings roll on gently, perfect for a road where the view drifts slowly by.' },
  1450778313: { artist: 'HYUKOH', country: 'Korea', genre: 'Indie Rock', about: 'The first full album from Korean band HYUKOH, led by Oh Hyuk. Rough yet tender guitars hold all the nerves and thrill of being 23.' },
  1242154383: { artist: 'The Black Skirts', country: 'Korea', genre: 'Indie Rock · Pop', about: 'The third album from The Black Skirts, the one-man band of Cho Hyu-il. Full of love songs, made for late-night drives.' },
  1313141842: { title: 'Suzanne', artist: 'Kim Sawol', country: 'Korea', genre: 'Folk', about: 'The first solo album from Korean singer-songwriter Kim Sawol. Quiet, talk-like songs and guitar for driving alone at night.' },
};

/** 영어 화면용 앨범 글자. 없는 값은 원래 앨범 값 */
export const albumEn = (album) => ({ ...album, ...(EN[album.id] || {}) });
export const ALBUM_EN_IDS = Object.freeze(Object.keys(EN).map(Number));
