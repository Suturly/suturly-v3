const team = [
  { name: 'Name One', role: 'Role / title', bio: 'Short bio or focus area for this teammate.' },
  { name: 'Name Two', role: 'Role / title', bio: 'Short bio or focus area for this teammate.' },
  { name: 'Name Three', role: 'Role / title', bio: 'Short bio or focus area for this teammate.' },
] as const

export function AboutTeamSection() {
  return (
    <section className="marketing-about-team" aria-labelledby="marketing-about-team-heading">
      <div className="section section--pad-lg">
        <div className="container">
          <h2 id="marketing-about-team-heading" className="h2 fg-primary">
            Our team
          </h2>
          <p className="paragraph fg-body u-mt-1 measure-readable marketing-about-team__lede">
            The people building Suturly — replace placeholders with real names, photos, and bios.
          </p>

          <div className="row u-mt-2">
            {team.map((member) => (
              <div key={member.name} className="col col-xs-12 col-md-4">
                <article className="marketing-about-team__card">
                  <div className="marketing-about-team__avatar" aria-hidden />
                  <h3 className="h4 fg-primary u-mt-1">{member.name}</h3>
                  <p className="marketing-about-team__role eyebrow fg-primary">{member.role}</p>
                  <p className="p-sm fg-body u-mt-1">{member.bio}</p>
                </article>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
